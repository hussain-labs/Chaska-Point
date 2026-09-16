const multer = require('multer');

// Configure Multer to use memory storage since we need the buffer to stream to Google Drive
const storage = multer.memoryStorage();

// Validate file types (images and videos)
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images and videos are allowed!'), false);
  }
};

// 50MB limit
const limits = {
  fileSize: 50 * 1024 * 1024,
};

const uploadMiddleware = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: limits,
});

module.exports = uploadMiddleware;
