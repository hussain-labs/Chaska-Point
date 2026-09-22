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
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS } from '../../theme/theme';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/config';
import PostItem from "../../components/PostItem";

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activePostId, setActivePostId] = useState(null);
  const { user } = useAuth();
  const lastTapRef = useRef({});

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems && viewableItems.length > 0) {
      setActivePostId(viewableItems[0].item.id);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 60,
  }).current;

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

  useFocusEffect(
    useCallback(() => {
      fetchFeed();
    }, [fetchFeed])
  );

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

  const handleSave = async (postId) => {
    // Optimistic UI update
    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        post.id === postId
          ? { ...post, isSaved: !post.isSaved }
          : post
      )
    );

    try {
      await api.post(`/posts/${postId}/save`);
    } catch (error) {
      // Revert on failure
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === postId
            ? { ...post, isSaved: !post.isSaved }
            : post
        )
      );
    }
  };

  const confirmDeletePost = (postId) => {
    Alert.alert(
      "Delete Post",
      "Are you sure you want to delete this post? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete(`/posts/${postId}`);
              setPosts(prev => prev.filter(p => p.id !== postId));
            } catch (error) {
              Alert.alert("Error", "Failed to delete post.");
            }
          }
        }
      ]
    );
  };

  const handlePostOptions = (post) => {
    if (post.user.id === user.id) {
      Alert.alert(
        "Post Options",
        "What would you like to do?",
        [
          { text: "Cancel", style: "cancel" },
          { 
            text: "Edit Post", 
            onPress: () => Alert.alert("Coming Soon", "Edit functionality is not implemented yet.")
          },
          { 
            text: "Delete Post", 
            style: "destructive",
            onPress: () => confirmDeletePost(post.id)
          }
        ]
      );
    } else {
      Alert.alert("Post Options", "No options available for this post.");
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

  const handleVideoPress = (postId) => {
    navigation.navigate('Reels', { initialPostId: postId });
  };

  const handleUserPress = (userId) => {
    navigation.navigate('ProfileTab', { screen: 'ProfileMain', params: { userId } });
  };

  const renderPost = ({ item: post }) => (
    <PostItem 
      post={post} 
      onDoubleTap={handleDoubleTap} 
      onLike={handleLike} 
      isActive={post.id === activePostId}
      onVideoPress={handleVideoPress}
      onUserPress={handleUserPress}
      onSave={handleSave}
      onPostOptions={handlePostOptions}
    />
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
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
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
