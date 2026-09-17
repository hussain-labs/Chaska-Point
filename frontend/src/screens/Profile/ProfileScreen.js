import React, { useState, useEffect, useCallback } from 'react';
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
import { useFocusEffect } from '@react-navigation/native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS } from '../../theme/theme';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/config';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_GAP = 1;
const NUM_COLUMNS = 3;
const TILE_SIZE = (SCREEN_WIDTH - GRID_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;

const ProfileGridItem = ({ item, onPress }) => {
  const player = useVideoPlayer(
    item.mediaType === 'video' ? item.mediaUrl : null,
    (player) => {
      player.loop = true;
      player.muted = true;
    }
  );
  return (
    <TouchableOpacity style={styles.gridTile} activeOpacity={0.8} onPress={onPress}>
      {item.mediaType === 'video' ? (
        <VideoView player={player} style={styles.gridImage} contentFit="cover" />
      ) : (
        <Image source={{ uri: item.mediaUrl }} style={styles.gridImage} resizeMode="cover" />
      )}
      <View style={styles.gridOverlay}>
        <View style={styles.gridStat}>
          <Ionicons name="heart" size={12} color={COLORS.white} />
          <Text style={styles.gridStatText}>{item.likesCount}</Text>
        </View>
        <View style={styles.gridStat}>
          <Ionicons name="chatbubble" size={12} color={COLORS.white} />
          <Text style={styles.gridStatText}>{item.commentsCount}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const ProfileScreen = ({ route, navigation }) => {
  const [profile, setProfile] = useState(null);
  const [savedPosts, setSavedPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('grid');
  const { user, logout } = useAuth();
  
  const targetUserId = route.params?.userId;
  const isOwnProfile = !targetUserId || targetUserId === user.id;

  const fetchProfile = useCallback(async () => {
    try {
      const endpoint = isOwnProfile ? '/users/me' : `/users/${targetUserId}`;
      const response = await api.get(endpoint);
      if (response.data.success) {
        setProfile(response.data.data);
      }
      if (isOwnProfile) {
        const savedResponse = await api.get('/users/me/saved');
        if (savedResponse.data.success) {
          setSavedPosts(savedResponse.data.data);
        }
      }
    } catch (error) {
      console.log('Failed to fetch profile:', error.message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [fetchProfile])
  );

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchProfile();
  };

  const handleLogout = () => {
    logout();
  };

  const handleFollow = async () => {
    if (!profile) return;
    
    // Optimistic update
    setProfile(prev => ({
      ...prev,
      isFollowing: !prev.isFollowing,
      followersCount: prev.isFollowing ? prev.followersCount - 1 : prev.followersCount + 1
    }));
    
    try {
      await api.post(`/users/${profile.id}/follow`);
    } catch (error) {
      // Revert on failure
      setProfile(prev => ({
        ...prev,
        isFollowing: !prev.isFollowing,
        followersCount: prev.isFollowing ? prev.followersCount - 1 : prev.followersCount + 1
      }));
    }
  };

  const renderProfileHeader = () => (
    <View style={styles.profileHeader}>
      {/* Avatar and Stats Row */}
      <View style={styles.statsRow}>
        <Image
          source={{ uri: profile?.avatar || 'https://i.pravatar.cc/150' }}
          style={styles.avatar}
        />
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{profile?.postsCount || 0}</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
          <TouchableOpacity 
            style={styles.statItem}
            onPress={() => navigation.navigate('UsersList', { userId: targetUserId || user.id, type: 'followers' })}
          >
            <Text style={styles.statNumber}>{profile?.followersCount || 0}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.statItem}
            onPress={() => navigation.navigate('UsersList', { userId: targetUserId || user.id, type: 'following' })}
          >
            <Text style={styles.statNumber}>{profile?.followingCount || 0}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Bio Section */}
      <View style={styles.bioSection}>
        <Text style={styles.fullName}>{profile?.fullName || user?.fullName}</Text>
        {profile?.bio ? <Text style={styles.bioText}>{profile.bio}</Text> : null}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionRow}>
        {isOwnProfile ? (
          <>
            <TouchableOpacity style={styles.editButton} onPress={() => navigation.navigate('EditProfile', { profile })}>
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={20} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity 
            style={[styles.editButton, profile?.isFollowing && styles.followingButton]} 
            onPress={handleFollow}
          >
            <Text style={[styles.editButtonText, profile?.isFollowing && styles.followingButtonText]}>
              {profile?.isFollowing ? 'Following' : 'Follow'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Tab Selector */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'grid' && styles.tabItemActive]}
          onPress={() => setActiveTab('grid')}
        >
          <Ionicons
            name="grid-outline"
            size={24}
            color={activeTab === 'grid' ? COLORS.textPrimary : COLORS.textSecondary}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'list' && styles.tabItemActive]}
          onPress={() => setActiveTab('list')}
        >
          <Ionicons
            name="list-outline"
            size={24}
            color={activeTab === 'list' ? COLORS.textPrimary : COLORS.textSecondary}
          />
        </TouchableOpacity>
        {isOwnProfile && (
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'saved' && styles.tabItemActive]}
            onPress={() => setActiveTab('saved')}
          >
            <Ionicons
              name="bookmark-outline"
              size={24}
              color={activeTab === 'saved' ? COLORS.textPrimary : COLORS.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderGridItem = ({ item }) => (
    <ProfileGridItem 
      item={item} 
      onPress={() => navigation.navigate('SinglePost', { postId: item.id })} 
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
        {!isOwnProfile && (
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: SPACING.md }}>
            <Ionicons name="arrow-back" size={26} color={COLORS.textPrimary} />
          </TouchableOpacity>
        )}
        <Text style={[styles.headerUsername, !isOwnProfile && { flex: 1 }]}>
          {profile?.username || user?.username}
        </Text>
        {isOwnProfile && (
          <TouchableOpacity>
            <Ionicons name="menu-outline" size={26} color={COLORS.textPrimary} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={activeTab === 'saved' ? savedPosts : (profile?.posts || [])}
        renderItem={renderGridItem}
        keyExtractor={(item) => item.id}
        numColumns={NUM_COLUMNS}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={renderProfileHeader}
        contentContainerStyle={styles.gridContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={COLORS.primary} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="camera-outline" size={48} color={COLORS.textTertiary} />
            <Text style={styles.emptyText}>
              {activeTab === 'saved' ? 'No Saved Posts' : 'No Posts Yet'}
            </Text>
            <Text style={styles.emptySubtext}>
              {activeTab === 'saved' 
                ? "Posts you save will appear here." 
                : "Share photos to see them on your profile."}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  headerUsername: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
  },
  profileHeader: {
    paddingBottom: SPACING.xs,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xl,
  },
  avatar: {
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  statsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginLeft: SPACING.xl,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
  },
  statLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  bioSection: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  fullName: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.textPrimary,
  },
  bioText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    marginTop: SPACING.xs,
    lineHeight: 20,
  },
  actionRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  editButton: {
    flex: 1,
    height: 36,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.textPrimary,
  },
  followingButton: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  followingButtonText: {
    color: COLORS.white,
  },
  logoutButton: {
    width: 36,
    height: 36,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabRow: {
    flexDirection: 'row',
    borderTopWidth: 0.5,
    borderTopColor: COLORS.border,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  tabItemActive: {
    borderBottomWidth: 1.5,
    borderBottomColor: COLORS.textPrimary,
  },
  gridContent: {
    flexGrow: 1,
  },
  gridTile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    marginRight: GRID_GAP,
    marginBottom: GRID_GAP,
    position: 'relative',
  },
  gridImage: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.surface,
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.md,
    opacity: 0,
  },
  gridStat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gridStatText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.bold,
    marginLeft: 4,
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
    marginTop: SPACING.lg,
  },
  emptySubtext: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
  },
});

export default ProfileScreen;
