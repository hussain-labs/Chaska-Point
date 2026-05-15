const express = require('express');
const AuthController = require('../controllers/authController');

const router = express.Router();

// POST /auth/register - Create new account
router.post('/register', AuthController.register);

// POST /auth/login - Login to existing account
router.post('/login', AuthController.login);

module.exports = router;
