const mongoose = require('mongoose');
const User = require('../models/User');
const Post = require('../models/Post');
const Activity = require('../models/Activity');

/**
 * User Service - Business logic for user profiles
 */
const UserService = {
  /**
   * Get user profile by ID
   */
  getProfile: async (userId) => {
    const user = await User.findById(userId);
    if (!user) {
      throw { status: 404, message: 'User not found.' };
    }

    const posts = await Post.find({ userId }).sort({ createdAt: -1 });
    
    const userObj = user.toJSON();
    delete userObj.password;

    return {
      ...userObj,
      postsCount: posts.length,
      followersCount: user.followers.length,
      followingCount: user.following.length,
      posts: posts.map((post) => ({
        id: post._id.toString(),
        mediaUrl: post.mediaUrl,
        mediaType: post.mediaType,
        likesCount: post.likes.length,
        commentsCount: post.comments.length,
      })),
    };
  },

  /**
   * Get user's activity/notifications
   */
  getActivity: async (userId) => {
    const activities = await Activity.find({ userId })
      .sort({ createdAt: -1 })
      .populate('fromUserId', 'username avatar');
      
    return activities.map(activity => {
      const a = activity.toJSON();
      const fromUser = a.fromUserId;
      delete a.fromUserId;
      
      return {
        ...a,
        fromUser: fromUser ? { id: fromUser.id, username: fromUser.username, avatar: fromUser.avatar } : null,
      };
    });
  },

  /**
   * Update user profile
   */
  updateProfile: async (userId, { fullName, bio, avatarFile }) => {
    const user = await User.findById(userId);
    if (!user) {
      throw { status: 404, message: 'User not found.' };
    }

    if (fullName) user.fullName = fullName;
    if (bio !== undefined) user.bio = bio;

    if (avatarFile) {
      const { uploadToGoogleDrive } = require('../utils/googleDrive');
      const avatarUrl = await uploadToGoogleDrive(avatarFile);
      user.avatar = avatarUrl;
    }

    await user.save();
    
    const userObj = user.toJSON();
    delete userObj.password;
    return userObj;
  },


  /**
   * Search users by username or full name
   */
  searchUsers: async (query, currentUserId) => {
    if (!query || query.trim() === '') return [];
    
    // Case-insensitive regex search on username and fullName
    const regex = new RegExp(query, 'i');
    
    const users = await User.find({
      $or: [{ username: regex }, { fullName: regex }]
    })
    .limit(20)
    .select('username fullName avatar followers');
    
    return users.map(user => {
      const u = user.toJSON();
      return {
        ...u,
        isFollowing: user.followers.includes(currentUserId)
      };
    });
  },

  /**
   * Toggle follow/unfollow a user
   */
  toggleFollow: async (targetUserId, currentUserId) => {
    if (targetUserId === currentUserId) {
      throw { status: 400, message: 'You cannot follow yourself.' };
    }

    const targetUser = await User.findById(targetUserId);
    const currentUser = await User.findById(currentUserId);

    if (!targetUser || !currentUser) {
      throw { status: 404, message: 'User not found.' };
    }

    const isFollowing = targetUser.followers.includes(currentUserId);

    if (isFollowing) {
      // Unfollow
      targetUser.followers = targetUser.followers.filter(id => id.toString() !== currentUserId);
      currentUser.following = currentUser.following.filter(id => id.toString() !== targetUserId);
    } else {
      // Follow
      targetUser.followers.push(currentUserId);
      currentUser.following.push(targetUserId);
      
      // Create activity for the target user
      const Activity = require('../models/Activity');
      await Activity.create({
        userId: targetUser._id,
        type: 'follow',
        fromUserId: currentUser._id,
      });
    }

    await targetUser.save();
    await currentUser.save();

    return { 
      isFollowing: !isFollowing,
      followersCount: targetUser.followers.length 
    };
  },
};

module.exports = UserService;
