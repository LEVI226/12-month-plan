import React from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { FONTS, makeStyles, radius, spacing, useTheme } from '@/src/theme';
import { Txt } from '@/src/components/Txt';
import { Icon, IconName } from '@/src/components/Icon';

type Variant = 'primary' | 'secondary' | 'ghost';

interface Props {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  icon?: IconName;
  haptic?: 'light' | 'medium' | 'success';
  testID?: string;
  fullWidth?: boolean;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  icon,
  haptic = 'light',
  testID,
  fullWidth = true,
}: Props) {
  const s = useStyles();
  const { colors } = useTheme();
  const isDisabled = disabled || loading;

  const bg =
    variant === 'primary'
      ? colors.brandPrimary
      : variant === 'secondary'
        ? colors.surfaceTertiary
        : 'transparent';
  const fg =
    variant === 'primary'
      ? colors.onBrandPrimary
      : variant === 'secondary'
        ? colors.onSurface
        : colors.brandPrimary;

  const handlePress = () => {
    if (isDisabled) return;
    const type =
      haptic === 'success'
        ? Haptics.NotificationFeedbackType.Success
        : haptic === 'medium'
          ? Haptics.ImpactFeedbackStyle.Medium
          : Haptics.ImpactFeedbackStyle.Light;
    if (haptic === 'success') {
      Haptics.notificationAsync(type as Haptics.NotificationFeedbackType);
    } else {
      Haptics.impactAsync(type as Haptics.ImpactFeedbackStyle);
    }
    onPress();
  };

  return (
    <Pressable
      testID={testID}
      onPress={handlePress}
      disabled={isDisabled}
      style={({ pressed }) => [
        s.base,
        { backgroundColor: bg },
        fullWidth && { alignSelf: 'stretch' },
        variant === 'ghost' && s.ghost,
        pressed && !isDisabled && { opacity: 0.85, transform: [{ scale: 0.99 }] },
        isDisabled && { opacity: 0.45 },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={s.content}>
          {icon ? <Icon name={icon} size={19} color={fg} strokeWidth={2} /> : null}
          <Txt style={{ fontFamily: FONTS.bodyBold, fontSize: 16, color: fg }}>{label}</Txt>
        </View>
      )}
    </Pressable>
  );
}

const useStyles = makeStyles((c) => ({
  base: {
    height: 54,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  ghost: {
    height: 48,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
}));
