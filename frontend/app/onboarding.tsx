import React, { useMemo, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  KeyboardAwareScrollView,
  KeyboardStickyView,
} from 'react-native-keyboard-controller';
import * as Haptics from 'expo-haptics';
import { makeStyles, radius, spacing, useTheme } from '@/src/theme';
import { Txt } from '@/src/components/Txt';
import { Button } from '@/src/components/Button';
import { Icon } from '@/src/components/Icon';
import { useStore } from '@/src/store/AppStore';
import { detectTimezone } from '@/src/lib/date';

const WELCOME_BG =
  'https://images.unsplash.com/photo-1714636608872-048fc9231892?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMjh8MHwxfHNlYXJjaHwxfHxzb2Z0JTIwYmVpZ2UlMjB3YXRlcmNvbG9yJTIwYWJzdHJhY3QlMjB0ZXh0dXJlfGVufDB8fHx8MTc4OTI0NzU2Nnww&ixlib=rb-4.1.0&q=85';

const TIMES = ['07:00', '08:00', '12:00', '18:00', '20:00', '21:00', '22:00'];

export default function Onboarding() {
  const s = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { saveSettings } = useStore();

  const [firstName, setFirstName] = useState('');
  const [reminderTime, setReminderTime] = useState('20:00');
  const timezone = useMemo(() => detectTimezone(), []);

  const canStart = firstName.trim().length > 0;

  const onStart = () => {
    saveSettings({ firstName: firstName.trim(), reminderTime, timezone });
    router.replace('/bilan');
  };

  return (
    <View style={s.root}>
      <KeyboardAwareScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        bottomOffset={90}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.hero}>
          <Image source={{ uri: WELCOME_BG }} style={s.heroImg} contentFit="cover" transition={300} />
          <LinearGradient
            colors={['transparent', colors.surface]}
            style={s.heroScrim}
          />
          <View style={[s.badge, { top: insets.top + spacing.md }]}>
            <Icon name="shield" size={15} color={colors.brandPrimary} strokeWidth={2} />
            <Txt variant="label" color={colors.brandPrimary}>
              100% sur votre téléphone
            </Txt>
          </View>
        </View>

        <View style={s.body}>
          <Txt variant="display">Bienvenue</Txt>
          <Txt variant="body" style={{ marginTop: spacing.sm }}>
            Childeric vous aide à passer d'un bilan personnel à de petites actions
            quotidiennes, puis à tenir dans le temps. Rien ne quitte cet appareil.
          </Txt>

          <View style={s.field}>
            <Txt variant="label" style={s.fieldLabel}>
              Votre prénom
            </Txt>
            <TextInput
              testID="onboarding-firstname-input"
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Comment vous appelez-vous ?"
              placeholderTextColor={colors.muted}
              style={s.input}
              returnKeyType="done"
              autoCapitalize="words"
            />
          </View>

          <View style={s.field}>
            <Txt variant="label" style={s.fieldLabel}>
              Heure de votre point quotidien
            </Txt>
            <View style={s.chipsWrap}>
              {TIMES.map((t) => {
                const active = t === reminderTime;
                return (
                  <Pressable
                    key={t}
                    testID={`reminder-time-${t}`}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setReminderTime(t);
                    }}
                    style={[
                      s.timeChip,
                      { backgroundColor: active ? colors.brandPrimary : colors.surfaceTertiary },
                    ]}
                  >
                    <Txt
                      variant="bodyStrong"
                      color={active ? colors.onBrandPrimary : colors.onSurfaceSecondary}
                    >
                      {t}
                    </Txt>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={s.tzRow}>
            <Icon name="info" size={17} color={colors.muted} />
            <Txt variant="small">Fuseau détecté : {timezone}</Txt>
          </View>
        </View>
      </KeyboardAwareScrollView>

      <KeyboardStickyView offset={{ closed: 0, opened: insets.bottom }}>
        <View style={[s.footer, { paddingBottom: insets.bottom + spacing.md }]}>
          <Button
            testID="onboarding-start-button"
            label="Commencer"
            icon="arrow-right"
            onPress={onStart}
            disabled={!canStart}
          />
        </View>
      </KeyboardStickyView>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surface },
  hero: { height: 240, width: '100%' },
  heroImg: { width: '100%', height: '100%' },
  heroScrim: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 130 },
  badge: {
    position: 'absolute',
    left: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: c.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  body: { paddingHorizontal: spacing.xl, marginTop: -spacing.sm },
  field: { marginTop: spacing.xl },
  fieldLabel: { marginBottom: spacing.sm },
  input: {
    backgroundColor: c.surfaceTertiary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontFamily: 'Nunito-SemiBold',
    fontSize: 16,
    color: c.onSurface,
  },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  timeChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  tzRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    backgroundColor: c.surface,
    borderTopWidth: 1,
    borderTopColor: c.divider,
  },
}));
