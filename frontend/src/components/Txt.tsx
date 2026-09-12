import React from 'react';
import { Text, TextProps, TextStyle } from 'react-native';
import { FONTS, useTheme } from '@/src/theme';

type Variant =
  | 'display'
  | 'displaySm'
  | 'title'
  | 'subtitle'
  | 'body'
  | 'bodyStrong'
  | 'label'
  | 'small'
  | 'overline';

interface Props extends TextProps {
  variant?: Variant;
  color?: string;
  center?: boolean;
  children: React.ReactNode;
}

export function Txt({ variant = 'body', color, center, style, children, ...rest }: Props) {
  const { colors } = useTheme();
  const base = VARIANTS[variant];
  const resolved: TextStyle = {
    ...base,
    color: color ?? (variant === 'body' || variant === 'small' ? colors.onSurfaceSecondary : colors.onSurface),
  };
  if (variant === 'small' || variant === 'label' || variant === 'overline') {
    resolved.color = color ?? colors.muted;
  }
  if (center) resolved.textAlign = 'center';
  return (
    <Text style={[resolved, style]} {...rest}>
      {children}
    </Text>
  );
}

const VARIANTS: Record<Variant, TextStyle> = {
  display: { fontFamily: FONTS.display, fontSize: 30, lineHeight: 38 },
  displaySm: { fontFamily: FONTS.display, fontSize: 24, lineHeight: 32 },
  title: { fontFamily: FONTS.displayMedium, fontSize: 20, lineHeight: 27 },
  subtitle: { fontFamily: FONTS.bodyBold, fontSize: 16, lineHeight: 22 },
  body: { fontFamily: FONTS.body, fontSize: 15, lineHeight: 23 },
  bodyStrong: { fontFamily: FONTS.bodyMedium, fontSize: 15, lineHeight: 23 },
  label: { fontFamily: FONTS.bodyBold, fontSize: 13, lineHeight: 18 },
  small: { fontFamily: FONTS.body, fontSize: 13, lineHeight: 19 },
  overline: {
    fontFamily: FONTS.bodyExtra,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
};
