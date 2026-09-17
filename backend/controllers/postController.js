const PostService = require('../services/postService');

/**
 * Post Controller - Handles HTTP layer for posts
 */
const PostController = {
  /**
   * GET /posts
   * Get feed posts for the authenticated user
   */
  getFeed: async (req, res) => {
    try {
      const posts = await PostService.getFeed(req.user.id);

      res.status(200).json({
        success: true,
        data: posts,
        count: posts.length,
      });
    } catch (error) {
      res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Failed to fetch feed.',
      });
    }
  },

  /**
   * GET /posts/explore
   * Get explore/discover posts
   */
  getExplore: async (req, res) => {
    try {
      const posts = await PostService.getExplore(req.user.id);

      res.status(200).json({
        success: true,
        data: posts,
        count: posts.length,
      });
    } catch (error) {
      res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Failed to fetch explore posts.',
      });
    }
  },

  /**
   * GET /posts/reels
   * Get all video posts
   */
  getReels: async (req, res) => {
    try {
      const posts = await PostService.getReels(req.user.id);

      res.status(200).json({
        success: true,
        data: posts,
        count: posts.length,
      });
    } catch (error) {
      res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Failed to fetch reels.',
      });
    }
  },

  /**
   * POST /posts
   * Create a new post
   */
  create: async (req, res) => {
    try {
      const { caption } = req.body;
      const mediaFile = req.file;
      
      const post = await PostService.create(req.user.id, { mediaFile, caption });

      res.status(201).json({
        success: true,
        message: 'Post created successfully.',
        data: post,
      });
    } catch (error) {
      res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Failed to create post.',
      });
    }
  },

  /**
   * PATCH /posts/:id/like
   * Toggle like on a post
   */
  toggleLike: async (req, res) => {
    try {
      const { id } = req.params;
      const result = await PostService.toggleLike(id, req.user.id);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Failed to toggle like.',
      });
    }
  },

  /**
   * GET /posts/:id
   * Get a single post
   */
  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const post = await PostService.getById(id, req.user.id);

      res.status(200).json({
        success: true,
        data: post,
      });
    } catch (error) {
      res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Failed to fetch post.',
      });
    }
  },

  /**
   * POST /posts/:id/save
   * Toggle save on a post
   */
  toggleSave: async (req, res) => {
    try {
      const { id } = req.params;
      const result = await PostService.toggleSave(id, req.user.id);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Failed to toggle save.',
      });
    }
  },

  /**
   * DELETE /posts/:id
   * Delete a post
   */
  delete: async (req, res) => {
    try {
      const { id } = req.params;
      await PostService.deletePost(id, req.user.id);

      res.status(200).json({
        success: true,
        message: 'Post deleted successfully.',
      });
    } catch (error) {
      res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Failed to delete post.',
      });
    }
  },
};

module.exports = PostController;
