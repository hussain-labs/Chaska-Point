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
   * Get current user's saved posts
   */
  getSavedPosts: async (userId) => {
    const user = await User.findById(userId).populate({
      path: 'savedPosts',
      populate: { path: 'userId', select: 'username avatar fullName' },
    });

    if (!user) throw { status: 404, message: 'User not found.' };

    return user.savedPosts.map(post => {
      const p = post.toJSON();
      const u = p.userId;
      delete p.userId;
      
      return {
        ...p,
        user: u ? { id: u.id, username: u.username, avatar: u.avatar, fullName: u.fullName } : null,
        isLiked: p.likes.includes(userId),
        isSaved: true,
        likesCount: p.likes.length,
        commentsCount: p.comments.length,
      };
    }).reverse();
  },

  /**
   * Get user's followers
   */
  getFollowers: async (userId, currentUserId) => {
    const user = await User.findById(userId).populate('followers', 'username fullName avatar followers');
    if (!user) {
      throw { status: 404, message: 'User not found.' };
    }

    return user.followers.map(follower => {
      const u = follower.toJSON();
      return {
        ...u,
        isFollowing: follower.followers.includes(currentUserId)
      };
    });
  },

  /**
   * Get user's following
   */
  getFollowing: async (userId, currentUserId) => {
    const user = await User.findById(userId).populate('following', 'username fullName avatar followers');
    if (!user) {
      throw { status: 404, message: 'User not found.' };
    }

    return user.following.map(followingUser => {
      const u = followingUser.toJSON();
      return {
        ...u,
        isFollowing: followingUser.followers.includes(currentUserId)
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
