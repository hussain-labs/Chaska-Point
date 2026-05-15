const Database = require('../db/mockDatabase');

/**
 * Post Service - Business logic for posts
 */
const PostService = {
  /**
   * Get feed posts (all posts sorted by newest)
   */
  getFeed: (userId) => {
    const posts = Database.getAllPosts();
    // Enrich posts with user data and like status
    return posts.map((post) => {
      const author = Database.findUserById(post.userId);
      return {
        ...post,
        user: author ? { id: author.id, username: author.username, avatar: author.avatar, fullName: author.fullName } : null,
        isLiked: post.likes.includes(userId),
        likesCount: post.likes.length,
        commentsCount: post.comments.length,
      };
    });
  },

  /**
   * Get explore posts (randomized, excluding own)
   */
  getExplore: (userId) => {
    const posts = Database.getExplorePosts(userId);
    return posts.map((post) => {
      const author = Database.findUserById(post.userId);
      return {
        ...post,
        user: author ? { id: author.id, username: author.username, avatar: author.avatar } : null,
        likesCount: post.likes.length,
      };
    });
  },

  /**
   * Create a new post
   */
  create: (userId, { imageUrl, caption }) => {
    if (!imageUrl) {
      throw { status: 400, message: 'Image is required to create a post.' };
    }

    const post = Database.createPost({
      userId,
      imageUrl,
      caption: caption || '',
    });

    const author = Database.findUserById(userId);
    return {
      ...post,
      user: author ? { id: author.id, username: author.username, avatar: author.avatar, fullName: author.fullName } : null,
      isLiked: false,
      likesCount: 0,
      commentsCount: 0,
    };
  },

  /**
   * Toggle like on a post
   */
  toggleLike: (postId, userId) => {
    const result = Database.toggleLike(postId, userId);
    if (!result) {
      throw { status: 404, message: 'Post not found.' };
    }
    return result;
  },

  /**
   * Get a single post by ID
   */
  getById: (postId, userId) => {
    const post = Database.getPostById(postId);
    if (!post) {
      throw { status: 404, message: 'Post not found.' };
    }
    const author = Database.findUserById(post.userId);
    return {
      ...post,
      user: author ? { id: author.id, username: author.username, avatar: author.avatar, fullName: author.fullName } : null,
      isLiked: post.likes.includes(userId),
      likesCount: post.likes.length,
      commentsCount: post.comments.length,
    };
  },
};

module.exports = PostService;
