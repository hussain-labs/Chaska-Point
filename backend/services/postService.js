const mongoose = require('mongoose');
const Post = require('../models/Post');
const User = require('../models/User');
const Activity = require('../models/Activity');

/**
 * Post Service - Business logic for posts
 */
const PostService = {
  /**
   * Get feed posts (all posts sorted by newest)
   */
  getFeed: async (userId) => {
    const currentUser = await User.findById(userId).select('savedPosts');
    const savedPostsSet = new Set((currentUser?.savedPosts || []).map(id => id.toString()));

    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate('userId', 'username avatar fullName');
      
    return posts.map(post => {
      const p = post.toJSON();
      const user = p.userId;
      delete p.userId;
      
      return {
        ...p,
        user: user ? { id: user.id, username: user.username, avatar: user.avatar, fullName: user.fullName } : null,
        isLiked: p.likes.includes(userId),
        isSaved: savedPostsSet.has(p.id),
        likesCount: p.likes.length,
        commentsCount: p.comments.length,
      };
    });
  },

  /**
   * Get explore posts (randomized, excluding own)
   */
  getExplore: async (userId) => {
    const currentUser = await User.findById(userId).select('savedPosts');
    const savedPostsSet = new Set((currentUser?.savedPosts || []).map(id => id.toString()));

    const posts = await Post.aggregate([
      { $match: { userId: { $ne: new mongoose.Types.ObjectId(userId) } } },
      { $sample: { size: 50 } },
      { $sort: { createdAt: -1 } }
    ]);
    
    await Post.populate(posts, { path: 'userId', select: 'username avatar' });
    
    return posts.map(post => {
      // Aggregate returns raw objects, transform to match toJSON behavior
      const user = post.userId;
      const p = { ...post, id: post._id.toString() };
      delete p._id;
      delete p.__v;
      delete p.userId;
      
      return {
        ...p,
        user: user ? { id: user._id.toString(), username: user.username, avatar: user.avatar } : null,
        isLiked: p.likes.some(id => id.toString() === userId),
        isSaved: savedPostsSet.has(p.id),
        likesCount: p.likes.length,
        commentsCount: p.comments ? p.comments.length : 0,
      };
    });
  },

  /**
   * Get Reels (only video posts)
   */
  getReels: async (userId) => {
    const currentUser = await User.findById(userId).select('savedPosts');
    const savedPostsSet = new Set((currentUser?.savedPosts || []).map(id => id.toString()));

    const posts = await Post.find({ mediaType: 'video' })
      .sort({ createdAt: -1 })
      .populate('userId', 'username avatar fullName');
      
    return posts.map(post => {
      const p = post.toJSON();
      const user = p.userId;
      delete p.userId;
      
      return {
        ...p,
        user: user ? { id: user.id, username: user.username, avatar: user.avatar, fullName: user.fullName } : null,
        isLiked: p.likes.includes(userId),
        isSaved: savedPostsSet.has(p.id),
        likesCount: p.likes.length,
        commentsCount: p.comments.length,
      };
    });
  },

  /**
   * Create a new post
   */
  create: async (userId, { mediaFile, caption }) => {
    if (!mediaFile) {
      throw { status: 400, message: 'Media (image or video) is required to create a post.' };
    }

    const { uploadToGoogleDrive } = require('../utils/googleDrive');
    const mediaUrl = await uploadToGoogleDrive(mediaFile);
    
    // Determine media type based on mimetype
    const mediaType = mediaFile.mimetype.startsWith('video/') ? 'video' : 'image';

    const newPost = await Post.create({
      userId,
      mediaUrl,
      mediaType,
      caption: caption || '',
    });

    const post = await Post.findById(newPost._id).populate('userId', 'username avatar fullName');
    const p = post.toJSON();
    const user = p.userId;
    delete p.userId;
    
    return {
      ...p,
      user: user ? { id: user.id, username: user.username, avatar: user.avatar, fullName: user.fullName } : null,
      isLiked: false,
      likesCount: 0,
      commentsCount: 0,
    };
  },

  /**
   * Toggle like on a post
   */
  toggleLike: async (postId, userId) => {
    const post = await Post.findById(postId);
    if (!post) {
      throw { status: 404, message: 'Post not found.' };
    }

    const likeIndex = post.likes.indexOf(userId);
    let liked = false;
    
    if (likeIndex === -1) {
      post.likes.push(userId);
      liked = true;
      
      // Create activity
      if (post.userId.toString() !== userId) {
        await Activity.create({
          userId: post.userId,
          type: 'like',
          fromUserId: userId,
          postId: post._id
        });
      }
    } else {
      post.likes.splice(likeIndex, 1);
      liked = false;
      
      // Optional: remove activity if unliked
      await Activity.deleteOne({
        userId: post.userId,
        type: 'like',
        fromUserId: userId,
        postId: post._id
      });
    }

    await post.save();
    return { liked, likesCount: post.likes.length };
  },

  /**
   * Toggle save on a post
   */
  toggleSave: async (postId, userId) => {
    const post = await Post.findById(postId);
    if (!post) {
      throw { status: 404, message: 'Post not found.' };
    }

    const user = await User.findById(userId);
    if (!user) {
      throw { status: 404, message: 'User not found.' };
    }

    const savedIndex = user.savedPosts.indexOf(postId);
    let saved = false;

    if (savedIndex === -1) {
      user.savedPosts.push(postId);
      saved = true;
    } else {
      user.savedPosts.splice(savedIndex, 1);
      saved = false;
    }

    await user.save();
    return { isSaved: saved };
  },

  /**
   * Delete a post
   */
  deletePost: async (postId, userId) => {
    const post = await Post.findById(postId);
    if (!post) {
      throw { status: 404, message: 'Post not found.' };
    }
    
    if (post.userId.toString() !== userId) {
      throw { status: 403, message: 'You are not authorized to delete this post.' };
    }

    // Delete associated activities (likes, comments)
    await Activity.deleteMany({ postId: post._id });

    // Delete post
    await Post.findByIdAndDelete(postId);
    
    // Also remove from all users' savedPosts
    await User.updateMany(
      { savedPosts: post._id },
      { $pull: { savedPosts: post._id } }
    );
    
    return { success: true };
  },

  /**
   * Get a single post by ID
   */
  getById: async (postId, userId) => {
    const currentUser = await User.findById(userId).select('savedPosts');
    const isSaved = currentUser?.savedPosts?.some(id => id.toString() === postId) || false;

    const post = await Post.findById(postId).populate('userId', 'username avatar fullName');
    if (!post) {
      throw { status: 404, message: 'Post not found.' };
    }
    
    const p = post.toJSON();
    const user = p.userId;
    delete p.userId;
    
    return {
      ...p,
      user: user ? { id: user.id, username: user.username, avatar: user.avatar, fullName: user.fullName } : null,
      isLiked: p.likes.includes(userId),
      isSaved,
      likesCount: p.likes.length,
      commentsCount: p.comments.length,
    };
  },
};

module.exports = PostService;
