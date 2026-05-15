const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Database = require('../db/mockDatabase');

/**
 * Auth Service - Business logic for authentication
 */
const AuthService = {
  /**
   * Register a new user
   */
  register: async ({ username, email, password, fullName }) => {
    // Check if user already exists
    const existingEmail = Database.findUserByEmail(email);
    if (existingEmail) {
      throw { status: 400, message: 'An account with this email already exists.' };
    }

    const existingUsername = Database.findUserByUsername(username);
    if (existingUsername) {
      throw { status: 400, message: 'This username is already taken.' };
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = Database.createUser({
      username,
      email,
      password: hashedPassword,
      fullName: fullName || username,
      bio: '',
      avatar: `https://i.pravatar.cc/150?u=${username}`,
    });

    // Generate token
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });

    const { password: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };
  },

  /**
   * Login an existing user
   */
  login: async ({ email, password }) => {
    const user = Database.findUserByEmail(email);
    if (!user) {
      throw { status: 401, message: 'Invalid email or password.' };
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw { status: 401, message: 'Invalid email or password.' };
    }

    // Generate token
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });

    const { password: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };
  },
};

module.exports = AuthService;
