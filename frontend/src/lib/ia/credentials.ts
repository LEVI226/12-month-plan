import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import type { AIConfig } from './client';

const KEY = 'childeric.ai.credentials';
export async function getCredentials(): Promise<{ config: AIConfig; key: string } | null> {
  if (Platform.OS === 'web') return null;
  const raw = await SecureStore.getItemAsync(KEY);
  return raw ? JSON.parse(raw) : null;
}
export async function saveCredentials(config: AIConfig, key: string) {
  if (Platform.OS === 'web') throw new Error('Configurez votre clé dans l’application mobile, où le stockage sécurisé est disponible.');
  await SecureStore.setItemAsync(KEY, JSON.stringify({ config, key }), { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY });
}
export async function clearCredentials() {
  if (Platform.OS !== 'web') await SecureStore.deleteItemAsync(KEY);
}
