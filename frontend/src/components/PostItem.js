import React, { useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS } from '../theme/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const PostItem = ({ post, onDoubleTap, onLike, isActive, onVideoPress, onUserPress, onSave, onPostOptions }) => {
  const player = useVideoPlayer(
    post.mediaType === 'video' ? post.mediaUrl : null,
    (player) => {
      player.loop = true;
    }
  );

  useEffect(() => {
    if (post.mediaType === 'video') {
      if (isActive) {
        player.play();
      } else {
        player.pause();
      }
    }
  }, [isActive, post.mediaType]);

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

  return (
    <View style={styles.postContainer}>
      {/* Post Header */}
      <View style={styles.postHeader}>
        <TouchableOpacity style={styles.postHeaderLeft} onPress={() => onUserPress(post.user?.id)}>
          <Image source={{ uri: post.user?.avatar }} style={styles.avatar} />
          <Text style={styles.username}>{post.user?.username}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onPostOptions(post)}>
          <Ionicons name="ellipsis-horizontal" size={20} color={COLORS.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Post Image with Double Tap / Video Press */}
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => {
          if (post.mediaType === 'video') {
            onVideoPress(post.id);
          } else {
            onDoubleTap(post.id, post.isLiked);
          }
        }}
      >
        {post.mediaType === 'video' ? (
          <VideoView
            player={player}
            style={styles.postImage}
            contentFit="cover"
            allowsFullscreen
            allowsPictureInPicture
          />
        ) : (
          <Image
            source={{ uri: post.mediaUrl }}
            style={styles.postImage}
            resizeMode="cover"
          />
        )}
      </TouchableOpacity>

      {/* Interaction Bar */}
      <View style={styles.interactionBar}>
        <View style={styles.interactionLeft}>
          <TouchableOpacity onPress={() => onLike(post.id)} style={styles.iconButton}>
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
        <TouchableOpacity onPress={() => onSave(post.id)}>
          <Ionicons 
            name={post.isSaved ? "bookmark" : "bookmark-outline"} 
            size={24} 
            color={post.isSaved ? COLORS.primary : COLORS.textPrimary} 
          />
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
            <Text style={styles.captionUsername} onPress={() => onUserPress(post.user?.id)}>
              {post.user?.username}{' '}
            </Text>
            {post.caption}
          </Text>
        ) : null}

        {/* Comments preview */}
        {post.commentsCount > 0 ? (
          <TouchableOpacity>
            <Text style={styles.viewComments}>
              View all {post.commentsCount} {post.commentsCount === 1 ? 'comment' : 'comments'}
            </Text>
          </TouchableOpacity>
        ) : null}

        {/* Timestamp */}
        <Text style={styles.timestamp}>{getTimeAgo(post.createdAt)}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
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
});

export default PostItem;
