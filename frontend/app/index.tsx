import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Redirect } from 'expo-router';
import { useStore } from '@/src/store/AppStore';
import { useTheme } from '@/src/theme';

export default function Index() {
  const { ready, state } = useStore();
  const { colors } = useTheme();

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface }}>
        <ActivityIndicator color={colors.brandPrimary} />
      </View>
    );
  }

  if (!state.settings) return <Redirect href="/onboarding" />;
  if (state.bilan.status !== 'frozen') return <Redirect href="/bilan" />;
  if (!state.plan) return <Redirect href="/plan-create" />;
  return <Redirect href="/(tabs)" />;
}
