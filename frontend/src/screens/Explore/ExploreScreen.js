import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS } from '../../theme/theme';
import api from '../../api/config';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const GridItem = ({ item, isLargeTile }) => {
  const player = useVideoPlayer(
    item.mediaType === 'video' ? item.mediaUrl : null,
    (player) => {
      player.loop = true;
      player.muted = true;
    }
  );

  return (
    <TouchableOpacity
      style={[
        styles.gridTile,
        isLargeTile && styles.gridTileLarge,
      ]}
      activeOpacity={0.8}
    >
      {item.mediaType === 'video' ? (
        <VideoView player={player} style={styles.gridImage} contentFit="cover" />
      ) : (
        <Image source={{ uri: item.mediaUrl || item.imageUrl }} style={styles.gridImage} resizeMode="cover" />
      )}
      <View style={styles.tileOverlay}>
        <View style={styles.tileStats}>
          <Ionicons name="heart" size={14} color={COLORS.white} />
          <Text style={styles.tileStatText}>{item.likesCount}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const GRID_GAP = 2;
const NUM_COLUMNS = 3;
const TILE_SIZE = (SCREEN_WIDTH - GRID_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;

const ExploreScreen = ({ navigation }) => {
  const [posts, setPosts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchExplore = useCallback(async () => {
    try {
      const response = await api.get('/posts/explore');
      if (response.data.success) {
        setPosts(response.data.data);
      }
    } catch (error) {
      console.log('Failed to fetch explore:', error.message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchExplore();
  }, [fetchExplore]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.trim()) {
        setIsSearching(true);
        try {
          const response = await api.get(`/users/search?q=${searchQuery}`);
          if (response.data.success) {
            setSearchResults(response.data.data);
          }
        } catch (error) {
          console.log('Search error:', error);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setSearchQuery('');
    fetchExplore();
  };

  const renderGridItem = ({ item, index }) => <GridItem item={item} isLargeTile={index % 9 === 0} />;

  const renderUserItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.userRow} 
      onPress={() => navigation.navigate('ProfileTab', { screen: 'ProfileMain', params: { userId: item.id } })}
    >
      <Image source={{ uri: item.avatar || 'https://i.pravatar.cc/150' }} style={styles.userAvatar} />
      <View style={styles.userInfo}>
        <Text style={styles.userUsername}>{item.username}</Text>
        <Text style={styles.userFullName}>{item.fullName}</Text>
      </View>
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
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={COLORS.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search"
            placeholderTextColor={COLORS.textSecondary}
            value={searchQuery}
            onChangeText={handleSearch}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <Ionicons name="close-circle" size={18} color={COLORS.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Content */}
      {searchQuery.trim() ? (
        isSearching ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : (
          <FlatList
            data={searchResults}
            renderItem={renderUserItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.searchListContainer}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="search-outline" size={64} color={COLORS.textTertiary} />
                <Text style={styles.emptyText}>No users found</Text>
              </View>
            }
          />
        )
      ) : (
        <FlatList
          data={posts}
          renderItem={renderGridItem}
          keyExtractor={(item) => item.id}
          numColumns={NUM_COLUMNS}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.gridContainer}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={COLORS.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="camera-outline" size={64} color={COLORS.textTertiary} />
              <Text style={styles.emptyText}>No posts to explore</Text>
            </View>
          }
        />
      )}
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
  searchContainer: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.background,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    height: 38,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    marginLeft: SPACING.sm,
    paddingVertical: 0,
  },
  gridContainer: {
    gap: GRID_GAP,
  },
  gridTile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    marginRight: GRID_GAP,
    marginBottom: GRID_GAP,
    position: 'relative',
  },
  gridTileLarge: {
    // Standard size in grid - all tiles uniform for 3-column layout
  },
  gridImage: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.surface,
  },
  tileOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
    padding: SPACING.xs,
  },
  tileStats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: SPACING.xs + 2,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
    alignSelf: 'flex-start',
  },
  tileStatText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.semibold,
    marginLeft: 3,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  emptyText: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.textSecondary,
    marginTop: SPACING.lg,
  },
  searchListContainer: {
    padding: SPACING.md,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  userInfo: {
    justifyContent: 'center',
  },
  userUsername: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
  },
  userFullName: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});

export default ExploreScreen;
