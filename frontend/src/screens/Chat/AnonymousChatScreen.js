import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONT_SIZES, FONT_WEIGHTS, SPACING } from '../../theme/theme';
import { Ionicons } from '@expo/vector-icons';

const AnonymousChatScreen = () => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Anonymous Chat</Text>
      </View>
      <View style={styles.content}>
        <Ionicons name="chatbubbles-outline" size={64} color={COLORS.textTertiary} />
        <Text style={styles.title}>Coming Soon</Text>
        <Text style={styles.subtitle}>Anonymous chat will be available here.</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  title: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});

export default AnonymousChatScreen;
