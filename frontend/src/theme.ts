import { useMemo } from 'react';
import { StyleSheet, useColorScheme } from 'react-native';

// Color tokens mirror design_guidelines.json (light) with a warm "journal at
// night" dark variant. Keys are identical across both themes.
export const lightColors = {
  surface: '#FAF8F5',
  onSurface: '#2C302B',
  surfaceSecondary: '#F2EFE9',
  onSurfaceSecondary: '#3A3F38',
  surfaceTertiary: '#EBE6DF',
  onSurfaceTertiary: '#4A5048',
  surfaceInverse: '#3A3F38',
  onSurfaceInverse: '#FAF8F5',
  brand: '#6A816C',
  onBrand: '#FFFFFF',
  brandPrimary: '#6A816C',
  onBrandPrimary: '#FFFFFF',
  brandSecondary: '#B88B7D',
  onBrandSecondary: '#FFFFFF',
  brandTertiary: '#E1E5E0',
  onBrandTertiary: '#3A3F38',
  success: '#759078',
  onSuccess: '#FFFFFF',
  warning: '#D8A05C',
  onWarning: '#FFFFFF',
  error: '#B88B7D',
  onError: '#FFFFFF',
  info: '#8FA391',
  onInfo: '#FFFFFF',
  border: '#E1DFDA',
  borderStrong: '#C2C0BB',
  divider: '#E1DFDA',
  muted: '#7E857B',
};

export const darkColors: typeof lightColors = {
  surface: '#1C1F1A',
  onSurface: '#EDEAE2',
  surfaceSecondary: '#24271F',
  onSurfaceSecondary: '#D9D6CC',
  surfaceTertiary: '#2E322A',
  onSurfaceTertiary: '#C4C2B8',
  surfaceInverse: '#EDEAE2',
  onSurfaceInverse: '#1C1F1A',
  brand: '#8CA88E',
  onBrand: '#15170F',
  brandPrimary: '#8CA88E',
  onBrandPrimary: '#15170F',
  brandSecondary: '#C79E90',
  onBrandSecondary: '#20140F',
  brandTertiary: '#343A31',
  onBrandTertiary: '#EDEAE2',
  success: '#8CA88E',
  onSuccess: '#15170F',
  warning: '#E0B074',
  onWarning: '#20170A',
  error: '#C79E90',
  onError: '#20140F',
  info: '#9FB3A1',
  onInfo: '#15170F',
  border: '#343A31',
  borderStrong: '#4A5145',
  divider: '#343A31',
  muted: '#98988C',
};

export type ThemeColors = typeof lightColors;

export const FONTS = {
  displayRegular: 'Fraunces-Regular',
  displayMedium: 'Fraunces-Medium',
  display: 'Fraunces-SemiBold',
  body: 'Nunito-Regular',
  bodyMedium: 'Nunito-SemiBold',
  bodyBold: 'Nunito-Bold',
  bodyExtra: 'Nunito-ExtraBold',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
};

export const radius = {
  sm: 6,
  md: 12,
  lg: 20,
  pill: 999,
};

export function useTheme() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  return { colors: isDark ? darkColors : lightColors, isDark };
}

type StyleFactory<T> = (colors: ThemeColors) => T;

export function makeStyles<T extends StyleSheet.NamedStyles<T>>(factory: StyleFactory<T>) {
  return function useStyles(): T {
    const { colors } = useTheme();
    return useMemo(() => StyleSheet.create(factory(colors)), [colors]);
  };
}
