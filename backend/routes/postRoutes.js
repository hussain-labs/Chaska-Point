const express = require('express');
const PostController = require('../controllers/postController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// All post routes require authentication
router.use(protect);

// GET /posts - Get feed
router.get('/', PostController.getFeed);

// GET /posts/explore - Get explore/discover posts
router.get('/explore', PostController.getExplore);

// GET /posts/reels - Get video reels
router.get('/reels', PostController.getReels);

// GET /posts/:id - Get single post
router.get('/:id', PostController.getById);

// POST /posts - Create new post
const uploadMiddleware = require('../middleware/uploadMiddleware');
router.post('/', uploadMiddleware.single('media'), PostController.create);

// PATCH /posts/:id/like - Toggle like
router.patch('/:id/like', PostController.toggleLike);

module.exports = router;
