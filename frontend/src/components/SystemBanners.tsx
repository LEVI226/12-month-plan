import React from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeOut } from 'react-native-reanimated';
import { makeStyles, radius, spacing, useTheme } from '@/src/theme';
import { Txt } from '@/src/components/Txt';
import { Icon } from '@/src/components/Icon';
import { useStore } from '@/src/store/AppStore';

// Persistent / one-shot banners about data safety: shown above everything
// else so the user always notices when a save fails or a backup had to be
// restored, without blocking the rest of the app.
export function SystemBanners() {
  const s = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { saveError, restoreMessage, dismissRestoreMessage } = useStore();

  if (!saveError && !restoreMessage) return null;

  return (
    <View style={[s.wrap, { top: insets.top + spacing.sm }]} pointerEvents="box-none">
      {saveError ? (
        <Animated.View
          entering={FadeInDown}
          style={[s.banner, { backgroundColor: colors.error }]}
          testID="save-error-banner"
        >
          <Icon name="info" size={16} color="#FFFFFF" />
          <Txt variant="small" color="#FFFFFF" style={{ flex: 1 }}>
            Enregistrement impossible — vos dernières modifications ne sont pas sauvegardées.
          </Txt>
        </Animated.View>
      ) : null}
      {restoreMessage ? (
        <Animated.View
          entering={FadeInDown}
          exiting={FadeOut}
          style={[s.banner, { backgroundColor: colors.brandPrimary }]}
          testID="restore-message-banner"
        >
          <Icon name="info" size={16} color={colors.onBrandPrimary} />
          <Txt variant="small" color={colors.onBrandPrimary} style={{ flex: 1 }}>
            {restoreMessage}
          </Txt>
          <Pressable onPress={dismissRestoreMessage} hitSlop={10} testID="dismiss-restore-message">
            <Icon name="x" size={14} color={colors.onBrandPrimary} />
          </Pressable>
        </Animated.View>
      ) : null}
    </View>
  );
}

const useStyles = makeStyles(() => ({
  wrap: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 999,
    gap: spacing.sm,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.md,
    padding: spacing.md,
  },
}));
