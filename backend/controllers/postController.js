const PostService = require('../services/postService');

/**
 * Post Controller - Handles HTTP layer for posts
 */
const PostController = {
  /**
   * GET /posts
   * Get feed posts for the authenticated user
   */
  getFeed: (req, res) => {
    try {
      const posts = PostService.getFeed(req.user.id);

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
  getExplore: (req, res) => {
    try {
      const posts = PostService.getExplore(req.user.id);

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
   * POST /posts
   * Create a new post
   */
  create: (req, res) => {
    try {
      const { imageUrl, caption } = req.body;
      const post = PostService.create(req.user.id, { imageUrl, caption });

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
  toggleLike: (req, res) => {
    try {
      const { id } = req.params;
      const result = PostService.toggleLike(id, req.user.id);

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
  getById: (req, res) => {
    try {
      const { id } = req.params;
      const post = PostService.getById(id, req.user.id);

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
};

module.exports = PostController;
