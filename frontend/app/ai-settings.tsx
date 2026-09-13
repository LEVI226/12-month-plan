import React from 'react';
import { ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AISettings } from '@/src/components/AISettings';
import { Button } from '@/src/components/Button';
import { useTheme } from '@/src/theme';
export default function AISettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  return <ScrollView style={{ backgroundColor: colors.surface }} contentContainerStyle={{ padding: 24, paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24, gap: 24 }} keyboardShouldPersistTaps="handled">
    <Button label="Retour au plan" variant="ghost" onPress={() => router.canGoBack() ? router.back() : router.replace('/plan-create')} />
    <AISettings />
  </ScrollView>;
}
