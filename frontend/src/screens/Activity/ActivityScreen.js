import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS } from '../../theme/theme';
import api from '../../api/config';

const ActivityScreen = () => {
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchActivity = useCallback(async () => {
    try {
      const response = await api.get('/users/me/activity');
      if (response.data.success) {
        setActivities(response.data.data);
      }
    } catch (error) {
      console.log('Failed to fetch activity:', error.message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchActivity();
  };

  const getActivityMessage = (activity) => {
    switch (activity.type) {
      case 'like':
        return 'liked your photo.';
      case 'comment':
        return `commented: "${activity.text}"`;
      case 'follow':
        return 'started following you.';
      default:
        return 'interacted with your content.';
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'like':
        return { name: 'heart', color: COLORS.like };
      case 'comment':
        return { name: 'chatbubble', color: COLORS.primary };
      case 'follow':
        return { name: 'person-add', color: COLORS.success };
      default:
        return { name: 'notifications', color: COLORS.textSecondary };
    }
  };

  const getTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const seconds = Math.floor((now - date) / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d`;
    return `${Math.floor(days / 7)}w`;
  };

  const renderActivity = ({ item }) => {
    const icon = getActivityIcon(item.type);
    return (
      <TouchableOpacity style={styles.activityItem} activeOpacity={0.7}>
        <View style={styles.activityLeft}>
          <Image
            source={{ uri: item.fromUser?.avatar || 'https://i.pravatar.cc/150' }}
            style={styles.avatar}
          />
          <View style={styles.activityContent}>
            <Text style={styles.activityText} numberOfLines={2}>
              <Text style={styles.activityUsername}>{item.fromUser?.username || 'Someone'} </Text>
              {getActivityMessage(item)}
              <Text style={styles.activityTime}> {getTimeAgo(item.createdAt)}</Text>
            </Text>
          </View>
        </View>
        <View style={[styles.activityIcon, { backgroundColor: icon.color + '15' }]}>
          <Ionicons name={icon.name} size={16} color={icon.color} />
        </View>
      </TouchableOpacity>
    );
  };

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
        <Text style={styles.headerTitle}>Activity</Text>
      </View>

      {/* Activity List */}
      <FlatList
        data={activities}
        renderItem={renderActivity}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={COLORS.primary} />
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="heart-outline" size={64} color={COLORS.textTertiary} />
            <Text style={styles.emptyText}>No activity yet</Text>
            <Text style={styles.emptySubtext}>
              When people like or comment on your posts, you'll see it here.
            </Text>
          </View>
        }
      />
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
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
  },
  listContent: {
    flexGrow: 1,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  activityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: SPACING.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    lineHeight: 20,
  },
  activityUsername: {
    fontWeight: FONT_WEIGHTS.semibold,
  },
  activityTime: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
  },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  separator: {
    height: 0.5,
    backgroundColor: COLORS.divider,
    marginLeft: 76,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
    paddingHorizontal: SPACING.xxxl,
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
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default ActivityScreen;
