import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator, Alert, TouchableOpacity, ScrollView, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PostItem from '../../components/PostItem';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS } from '../../theme/theme';
import api from '../../api/config';
import { useAuth } from '../../context/AuthContext';

const SinglePostScreen = ({ route, navigation }) => {
  const { postId } = route.params;
  const [post, setPost] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const lastTapRef = useRef({});

  useEffect(() => {
    fetchPost();
  }, [postId]);

  const fetchPost = async () => {
    try {
      const response = await api.get(`/posts/${postId}`);
      if (response.data.success) {
        setPost(response.data.data);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to load post.");
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  const handleLike = async () => {
    setPost(prev => ({
      ...prev,
      isLiked: !prev.isLiked,
      likesCount: prev.isLiked ? prev.likesCount - 1 : prev.likesCount + 1,
    }));
    try {
      await api.patch(`/posts/${postId}/like`);
    } catch (error) {
      setPost(prev => ({
        ...prev,
        isLiked: !prev.isLiked,
        likesCount: prev.isLiked ? prev.likesCount - 1 : prev.likesCount + 1,
      }));
    }
  };

  const handleDoubleTap = (id, isCurrentlyLiked) => {
    const now = Date.now();
    const lastTap = lastTapRef.current[id] || 0;
    if (now - lastTap < 300) {
      if (!isCurrentlyLiked) handleLike();
      lastTapRef.current[id] = 0;
    } else {
      lastTapRef.current[id] = now;
    }
  };

  const handleSave = async () => {
    setPost(prev => ({ ...prev, isSaved: !prev.isSaved }));
    try {
      await api.post(`/posts/${postId}/save`);
    } catch (error) {
      setPost(prev => ({ ...prev, isSaved: !prev.isSaved }));
    }
  };

  const handlePostOptions = () => {
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
            onPress: confirmDeletePost
          }
        ]
      );
    } else {
      Alert.alert("Post Options", "No options available for this post.");
    }
  };

  const confirmDeletePost = () => {
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
              navigation.goBack();
            } catch (error) {
              Alert.alert("Error", "Failed to delete post.");
            }
          }
        }
      ]
    );
  };

  const handleUserPress = (userId) => {
    navigation.navigate('ProfileTab', { screen: 'ProfileMain', params: { userId } });
  };

  if (isLoading || !post) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={26} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Post</Text>
        <View style={{ width: 26 }} />
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        <PostItem
          post={post}
          onDoubleTap={handleDoubleTap}
          onLike={handleLike}
          isActive={true}
          onVideoPress={() => {}}
          onUserPress={handleUserPress}
          onSave={handleSave}
          onPostOptions={handlePostOptions}
        />
      </ScrollView>
    </View>
  );
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
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: SPACING.xs,
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
  },
});

export default SinglePostScreen;
