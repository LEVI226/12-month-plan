import React from 'react';
import { ActivityIndicator, ColorValue, Platform, View } from 'react-native';
import { Redirect, Tabs } from 'expo-router';
import { FONTS, useTheme } from '@/src/theme';
import { Icon, IconName } from '@/src/components/Icon';
import { useStore } from '@/src/store/AppStore';

export default function TabsLayout() {
  const { colors } = useTheme();
  const { ready, state } = useStore();

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface }}>
        <ActivityIndicator color={colors.brandPrimary} />
      </View>
    );
  }
  // Self-heal if this route is reached with incomplete data (e.g. a web
  // hard-reload landing directly on a deep route after data was reset).
  if (!state.settings) return <Redirect href="/onboarding" />;
  if (!state.plan && state.bilan.status !== 'frozen') return <Redirect href="/bilan" />;
  if (!state.plan) return <Redirect href="/plan-create" />;

  const icon =
    (name: IconName) =>
    ({ color, focused }: { color: ColorValue; focused: boolean }) =>
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
