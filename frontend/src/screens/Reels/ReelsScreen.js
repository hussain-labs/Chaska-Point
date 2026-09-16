import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_SIZES, FONT_WEIGHTS, SPACING } from '../../theme/theme';
import api from '../../api/config';
import { useAuth } from '../../context/AuthContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const ReelsItem = ({ item, isActive, onLike }) => {
  const player = useVideoPlayer(item.mediaUrl, (player) => {
    player.loop = true;
  });

  useEffect(() => {
    if (isActive) {
      player.play();
    } else {
      player.pause();
    }
  }, [isActive]);

  return (
    <View style={styles.reelContainer}>
      <VideoView
        player={player}
        style={styles.video}
        contentFit="cover"
      />
      
      {/* Overlay Actions */}
      <View style={styles.overlay}>
        <View style={styles.bottomSection}>
          <View style={styles.userInfo}>
            <Image source={{ uri: item.user?.avatar }} style={styles.avatar} />
            <Text style={styles.username}>{item.user?.username}</Text>
          </View>
          {item.caption ? <Text style={styles.caption}>{item.caption}</Text> : null}
        </View>

        <View style={styles.actionSection}>
          <TouchableOpacity style={styles.actionButton} onPress={() => onLike(item.id)}>
            <Ionicons name={item.isLiked ? 'heart' : 'heart-outline'} size={32} color={item.isLiked ? COLORS.like : COLORS.white} />
            <Text style={styles.actionText}>{item.likesCount}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="chatbubble-outline" size={30} color={COLORS.white} />
            <Text style={styles.actionText}>{item.commentsCount}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="paper-plane-outline" size={30} color={COLORS.white} />
            <Text style={styles.actionText}>Share</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const ReelsScreen = ({ navigation, route }) => {
  const [reels, setReels] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // You can pass an initialPostId from Home screen to start at a specific reel
  const initialPostId = route.params?.initialPostId || null;
  const flatListRef = useRef(null);

  const fetchReels = async () => {
    try {
      const response = await api.get('/posts/reels');
      if (response.data.success) {
        setReels(response.data.data);
        if (response.data.data.length > 0) {
           setActiveId(initialPostId || response.data.data[0].id);
        }
      }
    } catch (error) {
      console.log('Failed to fetch reels:', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchReels();
      // Disable tab bar when entering reels (if managed dynamically), but easier to just overlay as full-screen modal
    }, [])
  );

  useEffect(() => {
    if (!isLoading && reels.length > 0 && initialPostId && flatListRef.current) {
      const index = reels.findIndex(r => r.id === initialPostId);
      if (index !== -1) {
        setTimeout(() => {
          flatListRef.current?.scrollToIndex({ index, animated: false });
        }, 100);
      }
    }
  }, [isLoading, reels, initialPostId]);

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems && viewableItems.length > 0) {
      setActiveId(viewableItems[0].item.id);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const handleLike = async (postId) => {
    setReels(prev => prev.map(r => 
      r.id === postId ? { ...r, isLiked: !r.isLiked, likesCount: r.isLiked ? r.likesCount - 1 : r.likesCount + 1 } : r
    ));
    try {
      await api.patch(`/posts/${postId}/like`);
    } catch (error) {
      // Ignore revert for simplicity
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.white} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={28} color={COLORS.white} />
      </TouchableOpacity>

      <FlatList
        ref={flatListRef}
        data={reels}
        renderItem={({ item }) => (
          <ReelsItem item={item} isActive={item.id === activeId} onLike={handleLike} />
        )}
        keyExtractor={item => item.id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(data, index) => ({
          length: SCREEN_HEIGHT,
          offset: SCREEN_HEIGHT * index,
          index,
        })}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    padding: 10,
  },
  reelContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    padding: SPACING.lg,
    paddingBottom: 40,
    backgroundColor: 'rgba(0,0,0,0.2)', // Slight gradient effect
  },
  bottomSection: {
    flex: 1,
    paddingRight: SPACING.lg,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.white,
  },
  username: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
  },
  caption: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
  },
  actionSection: {
    alignItems: 'center',
    gap: SPACING.lg,
  },
  actionButton: {
    alignItems: 'center',
  },
  actionText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semibold,
    marginTop: 4,
  },
});

export default ReelsScreen;
