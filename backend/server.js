require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Route imports
const authRoutes = require('./routes/authRoutes');
const postRoutes = require('./routes/postRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// --- Middleware ---
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// --- Request Logger (Development) ---
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// --- Routes ---
app.use('/auth', authRoutes);
app.use('/posts', postRoutes);
app.use('/users', userRoutes);

// --- Health Check ---
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Chaska Point API is running',
    version: '1.0.0',
    endpoints: {
      auth: '/auth/register, /auth/login',
      posts: '/posts, /posts/explore, /posts/:id, /posts/:id/like',
      users: '/users/me, /users/me/activity, /users/:id',
    },
  });
});

// --- 404 Handler ---
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found.`,
  });
});

// --- Global Error Handler ---
app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal server error.',
  });
});

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`\n  Chaska Point API Server`);
  console.log(`  =======================`);
  console.log(`  Status:  Running`);
  console.log(`  Port:    ${PORT}`);
  console.log(`  URL:     http://localhost:${PORT}`);
  console.log(`  Mode:    Development (Mock DB)\n`);
});

module.exports = app;
