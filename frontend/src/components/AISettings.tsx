import React, { useEffect, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { Txt } from './Txt';
import { Button } from './Button';
import { spacing, useTheme } from '../theme';
import { AIConfig, generer, PROVIDERS } from '../lib/ia/client';
import { clearCredentials, getCredentials, saveCredentials } from '../lib/ia/credentials';

export function AISettings() {
  const { colors } = useTheme();
  const [config, setConfig] = useState<AIConfig>({ provider: 'Claude', ...PROVIDERS.Claude });
  const [key, setKey] = useState('');
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { getCredentials().then(saved => { if (saved) { setConfig(saved.config); setKey(saved.key); } }).catch(() => setMessage('Lecture du stockage sécurisé impossible.')); }, []);
  const run = async (action: () => Promise<void>) => {
    setBusy(true); setMessage('');
    try { await action(); } catch (error) { setMessage(error instanceof Error ? error.message : 'Opération impossible.'); } finally { setBusy(false); }
  };
  const input = { color: colors.onSurface, borderColor: colors.border, borderWidth: 1, borderRadius: 8, padding: 12 };
  return <View style={{ gap: spacing.md }}>
    <Txt variant="subtitle">Génération par IA</Txt>
    <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
      {(Object.keys(PROVIDERS) as AIConfig['provider'][]).map(provider => <Pressable key={provider} accessibilityRole="radio" accessibilityState={{ checked: provider === config.provider }} disabled={busy} onPress={() => { setConfig({ provider, ...PROVIDERS[provider] }); setKey(''); }}><Txt color={provider === config.provider ? colors.brandPrimary : colors.muted}>{provider === config.provider ? '● ' : '○ '}{provider}</Txt></Pressable>)}
    </View>
    <Txt variant="small">URL de base</Txt>
    <TextInput accessibilityLabel="URL de base" value={config.base} editable={!busy} autoCapitalize="none" onChangeText={base => setConfig({ ...config, base })} style={input} />
    <Txt variant="small">Modèle</Txt>
    <TextInput accessibilityLabel="Modèle" value={config.model} editable={!busy} autoCapitalize="none" onChangeText={model => setConfig({ ...config, model })} style={input} />
    <Txt variant="small">Clé API</Txt>
    <TextInput accessibilityLabel="Clé API" value={key} editable={!busy} autoCapitalize="none" autoCorrect={false} secureTextEntry={!visible} onChangeText={setKey} style={input} />
    <Pressable accessibilityRole="button" onPress={() => setVisible(!visible)}><Txt variant="small">{visible ? 'Masquer la clé' : 'Afficher la clé'}</Txt></Pressable>
    <Txt variant="small">Votre clé reste dans le stockage sécurisé du téléphone. Les générations et le test de connexion sont facturés par votre fournisseur selon ses tarifs.</Txt>
    <Button label="Enregistrer" disabled={busy || !key.trim() || !config.model.trim() || !config.base.trim()} onPress={() => run(async () => { await saveCredentials(config, key.trim()); setMessage('Configuration enregistrée.'); })} />
    <Button label="Tester la connexion" variant="secondary" disabled={busy || !key.trim()} onPress={() => run(async () => { await generer(config, key, { system: 'Réponds brièvement.', user: 'Réponds uniquement OK.' }); setMessage('Connexion réussie.'); })} />
    <Button label="Effacer la clé" variant="ghost" disabled={busy} onPress={() => run(async () => { await clearCredentials(); setKey(''); setMessage('Clé effacée.'); })} />
    {message ? <Txt accessibilityRole="alert" variant="small">{message}</Txt> : null}
  </View>;
}
