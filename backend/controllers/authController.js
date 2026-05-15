const AuthService = require('../services/authService');

/**
 * Auth Controller - Handles HTTP layer for authentication
 */
const AuthController = {
  /**
   * POST /auth/register
   * Register a new user account
   */
  register: async (req, res) => {
    try {
      const { username, email, password, fullName } = req.body;

      // Validation
      if (!username || !email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Username, email, and password are required.',
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters.',
        });
      }

      if (username.length < 3) {
        return res.status(400).json({
          success: false,
          message: 'Username must be at least 3 characters.',
        });
      }

      const result = await AuthService.register({ username, email, password, fullName });

      res.status(201).json({
        success: true,
        message: 'Account created successfully.',
        data: result,
      });
    } catch (error) {
      res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Internal server error.',
      });
    }
  },

  /**
   * POST /auth/login
   * Login with email and password
   */
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required.',
        });
      }

      const result = await AuthService.login({ email, password });

      res.status(200).json({
        success: true,
        message: 'Login successful.',
        data: result,
      });
    } catch (error) {
      res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Internal server error.',
      });
    }
  },
};

module.exports = AuthController;
