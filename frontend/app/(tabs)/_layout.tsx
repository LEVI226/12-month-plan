import React from 'react';
import { Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { FONTS, useTheme } from '@/src/theme';
import { Icon, IconName } from '@/src/components/Icon';

export default function TabsLayout() {
  const { colors } = useTheme();

  const icon =
    (name: IconName) =>
    ({ color, focused }: { color: string; focused: boolean }) =>
      <Icon name={name} size={24} color={color} strokeWidth={focused ? 2.2 : 1.8} />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brandPrimary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.divider,
          borderTopWidth: 1,
          ...(Platform.OS === 'web' ? { height: 64 } : {}),
        },
        tabBarItemStyle: { alignSelf: 'center' },
        tabBarLabelStyle: { fontFamily: FONTS.bodyMedium, fontSize: 11 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: "Aujourd'hui", tabBarIcon: icon('sun') }}
      />
      <Tabs.Screen name="plan" options={{ title: 'Plan', tabBarIcon: icon('target') }} />
      <Tabs.Screen name="suivi" options={{ title: 'Suivi', tabBarIcon: icon('chart') }} />
      <Tabs.Screen
        name="reglages"
        options={{ title: 'Réglages', tabBarIcon: icon('sliders') }}
      />
    </Tabs>
  );
}
