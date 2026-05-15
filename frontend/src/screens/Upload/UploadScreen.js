import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS } from '../../theme/theme';
import api from '../../api/config';

const UploadScreen = ({ navigation }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [caption, setCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert(
        'Permission Required',
        'Please grant camera roll access to upload photos.'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const handleShare = async () => {
    if (!selectedImage) {
      Alert.alert('No Image', 'Please select an image to share.');
      return;
    }

    setIsUploading(true);

    try {
      // In production, you'd upload the image to a cloud service first.
      // For the mock backend, we pass a URL placeholder that simulates the upload.
      const imageUrl = selectedImage.startsWith('http')
        ? selectedImage
        : `https://picsum.photos/seed/${Date.now()}/600/600`;

      const response = await api.post('/posts', {
        imageUrl,
        caption: caption.trim(),
      });

      if (response.data.success) {
        Alert.alert('Success', 'Your post has been shared!', [
          {
            text: 'OK',
            onPress: () => {
              setSelectedImage(null);
              setCaption('');
              navigation.navigate('HomeTab');
            },
          },
        ]);
      }
    } catch (error) {
      Alert.alert('Upload Failed', error.message || 'Could not share your post. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>New Post</Text>
          <TouchableOpacity
            style={[styles.shareButton, (!selectedImage || isUploading) && styles.shareButtonDisabled]}
            onPress={handleShare}
            disabled={!selectedImage || isUploading}
          >
            {isUploading ? (
              <ActivityIndicator color={COLORS.white} size="small" />
            ) : (
              <Text style={styles.shareButtonText}>Share</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Image Selection Area */}
        {selectedImage ? (
          <View style={styles.imagePreviewContainer}>
            <Image source={{ uri: selectedImage }} style={styles.imagePreview} resizeMode="cover" />
            <TouchableOpacity style={styles.removeButton} onPress={handleRemoveImage}>
              <Ionicons name="close-circle" size={28} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.imagePicker} onPress={pickImage} activeOpacity={0.7}>
            <View style={styles.imagePickerInner}>
              <Ionicons name="image-outline" size={64} color={COLORS.textTertiary} />
              <Text style={styles.imagePickerText}>Tap to select a photo</Text>
              <Text style={styles.imagePickerSubtext}>From your photo library</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Caption Input */}
        <View style={styles.captionContainer}>
          <TextInput
            style={styles.captionInput}
            placeholder="Write a caption..."
            placeholderTextColor={COLORS.textTertiary}
            value={caption}
            onChangeText={setCaption}
            multiline
            maxLength={2200}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{caption.length}/2200</Text>
        </View>

        {/* Pick Another Image Button */}
        {selectedImage && (
          <TouchableOpacity style={styles.changeImageButton} onPress={pickImage}>
            <Ionicons name="swap-horizontal" size={20} color={COLORS.primary} />
            <Text style={styles.changeImageText}>Change Photo</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
  },
  shareButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm + 2,
    borderRadius: BORDER_RADIUS.md,
    minWidth: 80,
    alignItems: 'center',
  },
  shareButtonDisabled: {
    opacity: 0.4,
  },
  shareButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  imagePicker: {
    margin: SPACING.lg,
    height: 300,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    borderRadius: BORDER_RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
  },
  imagePickerInner: {
    alignItems: 'center',
  },
  imagePickerText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
  imagePickerSubtext: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textTertiary,
    marginTop: SPACING.xs,
  },
  imagePreviewContainer: {
    position: 'relative',
    margin: SPACING.lg,
  },
  imagePreview: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.surface,
  },
  removeButton: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 14,
  },
  captionContainer: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  captionInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    minHeight: 100,
    backgroundColor: COLORS.surface,
  },
  charCount: {
    textAlign: 'right',
    fontSize: FONT_SIZES.xs,
    color: COLORS.textTertiary,
    marginTop: SPACING.xs,
  },
  changeImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    marginHorizontal: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
  },
  changeImageText: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.medium,
    marginLeft: SPACING.sm,
  },
});

export default UploadScreen;
