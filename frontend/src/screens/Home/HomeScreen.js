import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS } from '../../theme/theme';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/config';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { user } = useAuth();
  const lastTapRef = useRef({});

  const fetchFeed = useCallback(async () => {
    try {
      const response = await api.get('/posts');
      if (response.data.success) {
        setPosts(response.data.data);
      }
    } catch (error) {
      console.log('Failed to fetch feed:', error.message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchFeed();
  };

  const handleLike = async (postId) => {
    // Optimistic UI update
    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        post.id === postId
          ? {
              ...post,
              isLiked: !post.isLiked,
              likesCount: post.isLiked ? post.likesCount - 1 : post.likesCount + 1,
            }
          : post
      )
    );

    try {
      await api.patch(`/posts/${postId}/like`);
    } catch (error) {
      // Revert on failure
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === postId
            ? {
                ...post,
                isLiked: !post.isLiked,
                likesCount: post.isLiked ? post.likesCount - 1 : post.likesCount + 1,
              }
            : post
        )
      );
    }
  };

  /**
   * Double Tap to Like Logic
   * Tracks the last tap time per post and triggers like on second tap within 300ms.
   */
  const handleDoubleTap = (postId, isCurrentlyLiked) => {
    const now = Date.now();
    const lastTap = lastTapRef.current[postId] || 0;
    const DOUBLE_TAP_DELAY = 300;

    if (now - lastTap < DOUBLE_TAP_DELAY) {
      // Double tap detected - only like (never unlike via double tap)
      if (!isCurrentlyLiked) {
        handleLike(postId);
      }
      lastTapRef.current[postId] = 0;
    } else {
      lastTapRef.current[postId] = now;
    }
  };

  const renderPost = ({ item: post }) => (
    <View style={styles.postContainer}>
      {/* Post Header */}
      <View style={styles.postHeader}>
        <TouchableOpacity style={styles.postHeaderLeft}>
          <Image source={{ uri: post.user?.avatar }} style={styles.avatar} />
          <Text style={styles.username}>{post.user?.username}</Text>
        </TouchableOpacity>
        <TouchableOpacity>
          <Ionicons name="ellipsis-horizontal" size={20} color={COLORS.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Post Image with Double Tap */}
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => handleDoubleTap(post.id, post.isLiked)}
      >
        <Image
          source={{ uri: post.imageUrl }}
          style={styles.postImage}
          resizeMode="cover"
        />
      </TouchableOpacity>

      {/* Interaction Bar */}
      <View style={styles.interactionBar}>
        <View style={styles.interactionLeft}>
          <TouchableOpacity onPress={() => handleLike(post.id)} style={styles.iconButton}>
            <Ionicons
              name={post.isLiked ? 'heart' : 'heart-outline'}
              size={26}
              color={post.isLiked ? COLORS.like : COLORS.textPrimary}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="chatbubble-outline" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="paper-plane-outline" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity>
          <Ionicons name="bookmark-outline" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Likes Count */}
      <View style={styles.captionSection}>
        <Text style={styles.likesCount}>
          {post.likesCount} {post.likesCount === 1 ? 'like' : 'likes'}
        </Text>

        {/* Caption */}
        {post.caption ? (
          <Text style={styles.captionText}>
            <Text style={styles.captionUsername}>{post.user?.username} </Text>
            {post.caption}
          </Text>
        ) : null}

        {/* Comments preview */}
        {post.commentsCount > 0 && (
          <TouchableOpacity>
            <Text style={styles.viewComments}>
              View all {post.commentsCount} {post.commentsCount === 1 ? 'comment' : 'comments'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Timestamp */}
        <Text style={styles.timestamp}>{getTimeAgo(post.createdAt)}</Text>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chaska Point</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerIcon}>
            <Ionicons name="heart-outline" size={26} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIcon}>
            <Ionicons name="paper-plane-outline" size={26} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Feed */}
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={COLORS.primary} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="camera-outline" size={64} color={COLORS.textTertiary} />
            <Text style={styles.emptyText}>No posts yet</Text>
            <Text style={styles.emptySubtext}>Follow people to see their photos here.</Text>
          </View>
        }
      />
    </View>
  );
};

/**
 * Helper to format timestamp into relative time
 */
const getTimeAgo = (dateString) => {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w ago`;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xxl + 2,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
    fontStyle: 'italic',
  },
  headerRight: {
    flexDirection: 'row',
    gap: SPACING.lg,
  },
  headerIcon: {
    padding: SPACING.xs,
  },
  postContainer: {
    marginBottom: SPACING.sm,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
  },
  postHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    marginRight: SPACING.sm + 2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  username: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.textPrimary,
  },
  postImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
    backgroundColor: COLORS.surface,
  },
  interactionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
  },
  interactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    marginRight: SPACING.lg,
  },
  captionSection: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
  },
  likesCount: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  captionText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    lineHeight: 20,
    marginBottom: SPACING.xs,
  },
  captionUsername: {
    fontWeight: FONT_WEIGHTS.semibold,
  },
  viewComments: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  timestamp: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  emptyText: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.textPrimary,
    marginTop: SPACING.lg,
  },
  emptySubtext: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
  },
});

export default HomeScreen;
