const UserService = require('../services/userService');

/**
 * User Controller - Handles HTTP layer for user profiles
 */
const UserController = {
  /**
   * GET /users/:id
   * Get user profile and post history
   */
  getProfile: (req, res) => {
    try {
      const { id } = req.params;
      const profile = UserService.getProfile(id);

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
   * Get current user's activity/notifications
   */
  getActivity: (req, res) => {
    try {
      const activities = UserService.getActivity(req.user.id);

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
  getMe: (req, res) => {
    try {
      const profile = UserService.getProfile(req.user.id);

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
};

module.exports = UserController;
