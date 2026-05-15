/**
 * Mock Database - Easily swappable for MongoDB/Mongoose
 * All collections are in-memory arrays with CRUD helpers.
 */

const { v4: uuidv4 } = require('uuid');

const db = {
  users: [
    {
      id: 'user_1',
      username: 'chaska_official',
      email: 'chaska@point.com',
      password: '$2a$10$XOPbrlUPQdwdJUpSrIF6X.LbE14qsMmKGhM1A8W9iqDOY0MzqZkye', // password123
      fullName: 'Chaska Point',
      bio: 'The official Chaska Point account. Sharing moments that matter.',
      avatar: 'https://i.pravatar.cc/150?img=1',
      followers: ['user_2', 'user_3'],
      following: ['user_2'],
      createdAt: new Date().toISOString(),
    },
    {
      id: 'user_2',
      username: 'foodie_adventures',
      email: 'foodie@point.com',
      password: '$2a$10$XOPbrlUPQdwdJUpSrIF6X.LbE14qsMmKGhM1A8W9iqDOY0MzqZkye',
      fullName: 'Food Explorer',
      bio: 'Exploring cuisines around the world one bite at a time.',
      avatar: 'https://i.pravatar.cc/150?img=2',
      followers: ['user_1'],
      following: ['user_1', 'user_3'],
      createdAt: new Date().toISOString(),
    },
    {
      id: 'user_3',
      username: 'travel_tales',
      email: 'travel@point.com',
      password: '$2a$10$XOPbrlUPQdwdJUpSrIF6X.LbE14qsMmKGhM1A8W9iqDOY0MzqZkye',
      fullName: 'Travel Tales',
      bio: 'Wanderer | Storyteller | Photographer',
      avatar: 'https://i.pravatar.cc/150?img=3',
      followers: ['user_2'],
      following: ['user_1'],
      createdAt: new Date().toISOString(),
    },
  ],

  posts: [
    {
      id: 'post_1',
      userId: 'user_1',
      imageUrl: 'https://picsum.photos/seed/chaska1/600/600',
      caption: 'Welcome to Chaska Point! Our journey begins here.',
      likes: ['user_2', 'user_3'],
      comments: [
        { id: 'c1', userId: 'user_2', text: 'Amazing start!', createdAt: new Date().toISOString() },
      ],
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: 'post_2',
      userId: 'user_2',
      imageUrl: 'https://picsum.photos/seed/food1/600/600',
      caption: 'This biryani was absolutely divine. 10/10 would recommend!',
      likes: ['user_1'],
      comments: [
        { id: 'c2', userId: 'user_1', text: 'Where is this place?', createdAt: new Date().toISOString() },
      ],
      createdAt: new Date(Date.now() - 7200000).toISOString(),
    },
    {
      id: 'post_3',
      userId: 'user_3',
      imageUrl: 'https://picsum.photos/seed/travel1/600/600',
      caption: 'Sunsets hit different when you are on a mountain top.',
      likes: ['user_1', 'user_2'],
      comments: [],
      createdAt: new Date(Date.now() - 10800000).toISOString(),
    },
    {
      id: 'post_4',
      userId: 'user_1',
      imageUrl: 'https://picsum.photos/seed/chaska2/600/600',
      caption: 'Building something special. Stay tuned for more updates!',
      likes: ['user_3'],
      comments: [
        { id: 'c3', userId: 'user_3', text: 'Cannot wait!', createdAt: new Date().toISOString() },
      ],
      createdAt: new Date(Date.now() - 14400000).toISOString(),
    },
    {
      id: 'post_5',
      userId: 'user_2',
      imageUrl: 'https://picsum.photos/seed/food2/600/600',
      caption: 'Street food is an art form. Change my mind.',
      likes: ['user_1', 'user_3'],
      comments: [],
      createdAt: new Date(Date.now() - 18000000).toISOString(),
    },
  ],

  activities: [
    { id: 'act_1', userId: 'user_1', type: 'like', fromUserId: 'user_2', postId: 'post_1', createdAt: new Date().toISOString() },
    { id: 'act_2', userId: 'user_1', type: 'comment', fromUserId: 'user_2', postId: 'post_1', text: 'Amazing start!', createdAt: new Date().toISOString() },
    { id: 'act_3', userId: 'user_2', type: 'like', fromUserId: 'user_1', postId: 'post_2', createdAt: new Date().toISOString() },
    { id: 'act_4', userId: 'user_1', type: 'follow', fromUserId: 'user_3', createdAt: new Date().toISOString() },
  ],
};

// Database helper methods (mirrors Mongoose-like API)
const Database = {
  // Users
  findUserById: (id) => db.users.find((u) => u.id === id) || null,
  findUserByEmail: (email) => db.users.find((u) => u.email === email) || null,
  findUserByUsername: (username) => db.users.find((u) => u.username === username) || null,
  createUser: (userData) => {
    const user = { id: uuidv4(), ...userData, followers: [], following: [], createdAt: new Date().toISOString() };
    db.users.push(user);
    return user;
  },
  updateUser: (id, updates) => {
    const index = db.users.findIndex((u) => u.id === id);
    if (index === -1) return null;
    db.users[index] = { ...db.users[index], ...updates };
    return db.users[index];
  },

  // Posts
  getAllPosts: () => [...db.posts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
  getPostById: (id) => db.posts.find((p) => p.id === id) || null,
  getPostsByUserId: (userId) => db.posts.filter((p) => p.userId === userId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
  createPost: (postData) => {
    const post = { id: uuidv4(), likes: [], comments: [], createdAt: new Date().toISOString(), ...postData };
    db.posts.unshift(post);
    return post;
  },
  toggleLike: (postId, userId) => {
    const post = db.posts.find((p) => p.id === postId);
    if (!post) return null;
    const likeIndex = post.likes.indexOf(userId);
    if (likeIndex === -1) {
      post.likes.push(userId);
      // Create activity
      const postOwner = post.userId;
      if (postOwner !== userId) {
        db.activities.unshift({
          id: uuidv4(),
          userId: postOwner,
          type: 'like',
          fromUserId: userId,
          postId,
          createdAt: new Date().toISOString(),
        });
      }
      return { liked: true, likesCount: post.likes.length };
    } else {
      post.likes.splice(likeIndex, 1);
      return { liked: false, likesCount: post.likes.length };
    }
  },

  // Activities
  getActivitiesByUserId: (userId) => db.activities.filter((a) => a.userId === userId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),

  // Explore - get posts from users not followed
  getExplorePosts: (userId) => {
    const user = db.users.find((u) => u.id === userId);
    if (!user) return db.posts;
    return db.posts.filter((p) => p.userId !== userId).sort(() => Math.random() - 0.5);
  },
};

module.exports = Database;
