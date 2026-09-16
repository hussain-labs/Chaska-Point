const { google } = require('googleapis');
const stream = require('stream');

/**
 * Configure OAuth2 Client for Google Drive
 */
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_DRIVE_CLIENT_ID,
  process.env.GOOGLE_DRIVE_CLIENT_SECRET,
  'https://developers.google.com/oauthplayground' // Default redirect for playground
);

// Set the permanent refresh token
oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_DRIVE_REFRESH_TOKEN,
});

const drive = google.drive({ version: 'v3', auth: oauth2Client });

/**
 * Uploads a file stream to Google Drive
 * @param {Object} file - The file object from Multer (req.file)
 * @returns {Promise<string>} The Google Drive direct view/stream URL
 */
const uploadToGoogleDrive = async (file) => {
  try {
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

    // Convert memory buffer to stream
    const bufferStream = new stream.PassThrough();
    bufferStream.end(file.buffer);

    const fileMetadata = {
      name: `${Date.now()}-${file.originalname}`,
      parents: [folderId],
    };

    const media = {
      mimeType: file.mimetype,
      body: bufferStream,
    };

    // Upload to Google Drive using the authenticated user's quota
    const response = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id',
    });

    const fileId = response.data.id;

    // Make the file publicly accessible so the frontend can load it
    await drive.permissions.create({
      fileId: fileId,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    // Generate the URL that can be used directly in an Image or Video component
    return `https://drive.google.com/uc?export=view&id=${fileId}`;
  } catch (error) {
    console.error('Google Drive Upload Error:', error);
    throw new Error('Failed to upload media to Google Drive');
  }
};

module.exports = {
  uploadToGoogleDrive,
};
