import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS } from '../../theme/theme';
import api from '../../api/config';
import { useAuth } from '../../context/AuthContext';

const UsersListScreen = ({ route, navigation }) => {
  const { userId, type } = route.params; // type is 'followers' or 'following'
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user: currentUser } = useAuth();

  const fetchUsers = useCallback(async () => {
    try {
      const endpoint = `/users/${userId}/${type}`;
      const response = await api.get(endpoint);
      if (response.data.success) {
        setUsers(response.data.data);
      }
    } catch (error) {
      console.log(`Failed to fetch ${type}:`, error.message);
    } finally {
      setIsLoading(false);
    }
  }, [userId, type]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleFollowToggle = async (targetUser, index) => {
    // Optimistic update
    const updatedUsers = [...users];
    updatedUsers[index].isFollowing = !updatedUsers[index].isFollowing;
    setUsers(updatedUsers);

    try {
      await api.post(`/users/${targetUser.id}/follow`);
    } catch (error) {
      // Revert on failure
      const revertedUsers = [...users];
      revertedUsers[index].isFollowing = !revertedUsers[index].isFollowing;
      setUsers(revertedUsers);
    }
  };

  const renderUser = ({ item, index }) => (
    <TouchableOpacity 
      style={styles.userItem} 
      activeOpacity={0.7}
      onPress={() => {
        if (item.id === currentUser.id) {
          navigation.navigate('ProfileMain');
        } else {
          navigation.push('ProfileMain', { userId: item.id });
        }
      }}
    >
      <Image
        source={{ uri: item.avatar || 'https://i.pravatar.cc/150' }}
        style={styles.avatar}
      />
      <View style={styles.userInfo}>
        <Text style={styles.username}>{item.username}</Text>
        <Text style={styles.fullName}>{item.fullName}</Text>
      </View>
      {item.id !== currentUser.id && (
        <TouchableOpacity
          style={[
            styles.followButton,
            item.isFollowing && styles.followingButton,
          ]}
          onPress={() => handleFollowToggle(item, index)}
        >
          <Text
            style={[
              styles.followButtonText,
              item.isFollowing && styles.followingButtonText,
            ]}
          >
            {item.isFollowing ? 'Following' : 'Follow'}
          </Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
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
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={26} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {type === 'followers' ? 'Followers' : 'Following'}
        </Text>
        <View style={{ width: 26 }} /> {/* Placeholder for alignment */}
      </View>

      <FlatList
        data={users}
        renderItem={renderUser}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {type === 'followers' ? 'No followers yet.' : 'Not following anyone yet.'}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  backButton: {
    padding: SPACING.xs,
    marginLeft: -SPACING.xs,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
  },
  listContent: {
    flexGrow: 1,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.textPrimary,
  },
  fullName: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  followButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    minWidth: 90,
    alignItems: 'center',
  },
  followingButton: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  followButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  followingButtonText: {
    color: COLORS.textPrimary,
  },
  separator: {
    height: 0.5,
    backgroundColor: COLORS.divider,
    marginLeft: 82,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  emptyText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
});

export default UsersListScreen;
