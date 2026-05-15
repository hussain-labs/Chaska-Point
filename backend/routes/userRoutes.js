const express = require('express');
const UserController = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// All user routes require authentication
router.use(protect);

// GET /users/me - Get current user profile
router.get('/me', UserController.getMe);

// GET /users/me/activity - Get current user's notifications
router.get('/me/activity', UserController.getActivity);

// GET /users/:id - Get any user's profile
router.get('/:id', UserController.getProfile);

module.exports = router;
