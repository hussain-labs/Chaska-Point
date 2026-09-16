import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS } from '../../theme/theme';
import api from '../../api/config';
import { useAuth } from '../../context/AuthContext';

const EditProfileScreen = ({ route, navigation }) => {
  const { profile } = route.params;
  const { user, updateUser } = useAuth();
  
  const [fullName, setFullName] = useState(profile?.fullName || user?.fullName || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [selectedAvatar, setSelectedAvatar] = useState(profile?.avatar || user?.avatar || null);
  const [avatarAsset, setAvatarAsset] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const pickAvatar = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Please grant camera roll access to upload an avatar.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedAvatar(result.assets[0].uri);
      setAvatarAsset(result.assets[0]);
    }
  };

  const handleSave = async () => {
    if (!fullName.trim()) {
      Alert.alert('Error', 'Full name cannot be empty.');
      return;
    }

    setIsSaving(true);

    try {
      const formData = new FormData();
      formData.append('fullName', fullName.trim());
      formData.append('bio', bio.trim());

      if (avatarAsset) {
        // Need to extract filename and type
        const filename = avatarAsset.uri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image`;
        
        formData.append('avatar', {
          uri: avatarAsset.uri,
          name: filename,
          type,
        });
      }

      const response = await api.put('/users/me', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        // Update global auth context user if necessary, or just rely on Profile screen refetch
        if (updateUser) {
          updateUser(response.data.data);
        }
        navigation.goBack();
      }
    } catch (error) {
      Alert.alert('Update Failed', error.message || 'Could not update your profile.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={28} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity style={styles.headerButton} onPress={handleSave} disabled={isSaving}>
          {isSaving ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : (
            <Ionicons name="checkmark" size={28} color={COLORS.primary} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.avatarSection}>
          <Image source={{ uri: selectedAvatar || 'https://i.pravatar.cc/150' }} style={styles.avatar} />
          <TouchableOpacity style={styles.changeAvatarBtn} onPress={pickAvatar}>
            <Text style={styles.changeAvatarText}>Change Profile Photo</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.formSection}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Your full name"
              placeholderTextColor={COLORS.textTertiary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Bio</Text>
            <TextInput
              style={[styles.input, styles.bioInput]}
              value={bio}
              onChangeText={setBio}
              placeholder="Write a short bio..."
              placeholderTextColor={COLORS.textTertiary}
              multiline
              maxLength={150}
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.m,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: SPACING.s,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: FONT_SIZES.l,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
  },
  headerButton: {
    padding: SPACING.xs,
    minWidth: 40,
    alignItems: 'center',
  },
  scrollContent: {
    padding: SPACING.m,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
    marginTop: SPACING.l,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: SPACING.m,
  },
  changeAvatarBtn: {
    padding: SPACING.s,
  },
  changeAvatarText: {
    color: COLORS.primary,
    fontWeight: FONT_WEIGHTS.semibold,
    fontSize: FONT_SIZES.m,
  },
  formSection: {
    gap: SPACING.l,
  },
  inputGroup: {
    gap: SPACING.xs,
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.s,
    fontWeight: FONT_WEIGHTS.medium,
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingVertical: SPACING.s,
    fontSize: FONT_SIZES.m,
    color: COLORS.textPrimary,
  },
  bioInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
});

export default EditProfileScreen;
