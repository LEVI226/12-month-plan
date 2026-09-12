import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Pressable } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { makeStyles, radius, spacing, useTheme } from '@/src/theme';
import { Txt } from '@/src/components/Txt';
import { Icon } from '@/src/components/Icon';
import { useStore } from '@/src/store/AppStore';
import { Badge, computeBadges } from '@/src/lib/badges';

// Shows a small, calm celebration the first time a new badge unlocks.
// Existing badges (already true on first load, e.g. after this feature
// ships for a returning tester) are marked as "seen" silently, without a
// popup burst.
export function BadgeCelebration() {
  const s = useStyles();
  const { colors } = useTheme();
  const { ready, state, markBadgesSeen } = useStore();
  const badges = useMemo(() => computeBadges(state), [state]);
  const [current, setCurrent] = useState<Badge | null>(null);
  const queueRef = useRef<Badge[]>([]);
  const firstCheck = useRef(true);

  useEffect(() => {
    if (!ready) return;
    const unlocked = badges.filter((b) => b.unlocked);

    if (firstCheck.current) {
      firstCheck.current = false;
      const toMark = unlocked.filter((b) => !state.celebratedBadgeIds.includes(b.id)).map((b) => b.id);
      if (toMark.length) markBadgesSeen(toMark);
      return;
    }

    const newOnes = unlocked.filter((b) => !state.celebratedBadgeIds.includes(b.id));
    if (newOnes.length) {
      markBadgesSeen(newOnes.map((b) => b.id));
      queueRef.current.push(...newOnes);
      if (!current) {
        const next = queueRef.current.shift();
        if (next) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setCurrent(next);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [badges, ready]);

  const dismiss = () => {
    setCurrent(null);
    const next = queueRef.current.shift();
    if (next) {
      setTimeout(() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setCurrent(next);
      }, 260);
    }
  };

  if (!current) return null;

  return (
    <Modal transparent visible animationType="fade" statusBarTranslucent onRequestClose={dismiss}>
      <Pressable style={s.backdrop} onPress={dismiss}>
        <Animated.View entering={ZoomIn.duration(280)} style={s.card}>
          <Animated.View entering={FadeIn.delay(80)} style={[s.iconWrap, { backgroundColor: colors.brandTertiary }]}>
            <Icon name={current.icon} size={30} color={colors.brandPrimary} strokeWidth={2} />
          </Animated.View>
          <Txt variant="overline" color={colors.brandPrimary} center>
            Nouveau badge
          </Txt>
          <Txt variant="title" center style={{ marginTop: spacing.xs }}>
            {current.title}
          </Txt>
          <Txt variant="small" center style={{ marginTop: spacing.sm }}>
            {current.description}
          </Txt>
          <Pressable testID="badge-dismiss-button" onPress={dismiss} style={s.button}>
            <Txt variant="bodyStrong" color={colors.onBrandPrimary}>
              Continuer
            </Txt>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const useStyles = makeStyles((c) => ({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(28,31,26,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: c.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: 'center',
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  button: {
    marginTop: spacing.xl,
    height: 48,
    borderRadius: radius.md,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: c.brandPrimary,
  },
}));
