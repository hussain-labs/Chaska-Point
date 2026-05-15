const Database = require('../db/mockDatabase');

/**
 * User Service - Business logic for user profiles
 */
const UserService = {
  /**
   * Get user profile by ID
   */
  getProfile: (userId) => {
    const user = Database.findUserById(userId);
    if (!user) {
      throw { status: 404, message: 'User not found.' };
    }

    const posts = Database.getPostsByUserId(userId);
    const { password, ...userWithoutPassword } = user;

    return {
      ...userWithoutPassword,
      postsCount: posts.length,
      followersCount: user.followers.length,
      followingCount: user.following.length,
      posts: posts.map((post) => ({
        id: post.id,
        imageUrl: post.imageUrl,
        likesCount: post.likes.length,
        commentsCount: post.comments.length,
      })),
    };
  },

  /**
   * Get user's activity/notifications
   */
  getActivity: (userId) => {
    const activities = Database.getActivitiesByUserId(userId);
    return activities.map((activity) => {
      const fromUser = Database.findUserById(activity.fromUserId);
      return {
        ...activity,
        fromUser: fromUser ? { id: fromUser.id, username: fromUser.username, avatar: fromUser.avatar } : null,
      };
    });
  },
};

module.exports = UserService;
