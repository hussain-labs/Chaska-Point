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

// GET /users/search - Search users
router.get('/search', UserController.search);

// GET /users/:id - Get any user's profile
router.get('/:id', UserController.getProfile);

// POST /users/:id/follow - Toggle follow status
router.post('/:id/follow', UserController.toggleFollow);

// PUT /users/me - Update profile
const uploadMiddleware = require('../middleware/uploadMiddleware');
router.put('/me', uploadMiddleware.single('avatar'), UserController.updateProfile);

module.exports = router;
