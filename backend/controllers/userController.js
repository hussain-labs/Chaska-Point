const UserService = require('../services/userService');

/**
 * User Controller - Handles HTTP layer for user profiles
 */
const UserController = {
  /**
   * GET /users/:id
   * Get user profile and post history
   */
  getProfile: async (req, res) => {
    try {
      const { id } = req.params;
      const profile = await UserService.getProfile(id);

      res.status(200).json({
        success: true,
        data: profile,
      });
    } catch (error) {
      res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Failed to fetch profile.',
      });
    }
  },

  /**
   * GET /users/me/activity
   * Get current user's notifications
   */
  getActivity: async (req, res) => {
    try {
      const activities = await UserService.getActivity(req.user.id);

      res.status(200).json({
        success: true,
        data: activities,
        count: activities.length,
      });
    } catch (error) {
      res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Failed to fetch activity.',
      });
    }
  },

  /**
   * GET /users/me
   * Get current authenticated user's profile
   */
  getMe: async (req, res) => {
    try {
      const profile = await UserService.getProfile(req.user.id);

      res.status(200).json({
        success: true,
        data: profile,
      });
    } catch (error) {
      res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Failed to fetch profile.',
      });
    }
  },

  /**
   * PUT /users/me
   * Update user profile
   */
  updateProfile: async (req, res) => {
    try {
      const { fullName, bio } = req.body;
      const avatarFile = req.file;

      const updatedUser = await UserService.updateProfile(req.user.id, {
        fullName,
        bio,
        avatarFile,
      });

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully.',
        data: updatedUser,
      });
    } catch (error) {
      res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Failed to update profile.',
      });
    }
  },
  /**
   * GET /users/search
   * Search users by name/username
   */
  search: async (req, res) => {
    try {
      const { q } = req.query;
      const users = await UserService.searchUsers(q, req.user.id);

      res.status(200).json({
        success: true,
        data: users,
      });
    } catch (error) {
      res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Failed to search users.',
      });
    }
  },

  /**
   * POST /users/:id/follow
   * Toggle follow status for a user
   */
  toggleFollow: async (req, res) => {
    try {
      const { id } = req.params;
      const result = await UserService.toggleFollow(id, req.user.id);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Failed to toggle follow.',
      });
    }
  },
};

module.exports = UserController;
