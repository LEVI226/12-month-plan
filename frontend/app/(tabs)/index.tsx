import React, { useEffect, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  KeyboardAwareScrollView,
  KeyboardStickyView,
} from 'react-native-keyboard-controller';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { makeStyles, radius, spacing, useTheme } from '@/src/theme';
import { Txt } from '@/src/components/Txt';
import { Button } from '@/src/components/Button';
import { Icon } from '@/src/components/Icon';
import { MoodSelector } from '@/src/components/MoodSelector';
import { useStore } from '@/src/store/AppStore';
import { capitalize, formatLongFr, todayKey } from '@/src/lib/date';
import { Occurrence, isCycleEnded } from '@/src/lib/plan';

export default function Today() {
  const s = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { state, occurrencesForDate, toggleOccurrence, setMood, setNote, closeDay, touchLastSeen } =
    useStore();

  const [welcomeMsg, setWelcomeMsg] = useState<string | null>(null);

  const key = todayKey();
  const dayLog = state.journal[key] ?? {};
  const closed = !!dayLog.closed;
  const occ = occurrencesForDate(key);
  const visible = occ.slice(0, 6);
  const extra = occ.length - visible.length;
  const doneCount = occ.filter((o) => o.status === 'done').length;
  const allDone = occ.length > 0 && doneCount === occ.length;
  const cycleEnded = !!state.plan && isCycleEnded(state.plan, key) && occ.length === 0;

  useEffect(() => {
    const daysAbsent = touchLastSeen();
    if (daysAbsent >= 2) {
      const name = state.settings?.firstName;
      setWelcomeMsg(
        `Content de vous revoir${name ? `, ${name}` : ''}. ${daysAbsent} jours sans passer, ce n'est pas grave. Un petit pas aujourd'hui suffit pour repartir en douceur.`
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onToggle = (o: Occurrence) => {
    Haptics.impactAsync(
      o.status === 'done' ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium
    );
    toggleOccurrence(o.id);
  };

  return (
    <View style={s.root}>
      <View style={[s.header, { paddingTop: insets.top + spacing.md }]}>
        <Txt variant="small" color={colors.muted}>
          Bonjour {state.settings?.firstName ?? ''}
        </Txt>
        <Txt variant="display">Aujourd&apos;hui</Txt>
        <Txt variant="bodyStrong" color={colors.brandPrimary}>
          {capitalize(formatLongFr(new Date()))}
        </Txt>
      </View>

      <KeyboardAwareScrollView
        contentContainerStyle={{ padding: spacing.xl, paddingBottom: 130, gap: spacing.lg }}
        bottomOffset={100}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {welcomeMsg ? (
          <Animated.View entering={FadeIn} exiting={FadeOut} style={s.welcomeBanner} testID="welcome-back-banner">
            <Icon name="sun" size={20} color={colors.brandPrimary} strokeWidth={2} />
            <Txt variant="bodyStrong" style={{ flex: 1 }}>
              {welcomeMsg}
            </Txt>
            <Pressable onPress={() => setWelcomeMsg(null)} hitSlop={10} testID="dismiss-welcome-back">
              <Icon name="x" size={16} color={colors.muted} />
            </Pressable>
          </Animated.View>
        ) : null}

        {cycleEnded ? (
          <View style={s.cycleNote}>
            <Icon name="rotate" size={18} color={colors.brandPrimary} strokeWidth={2} />
            <Txt variant="bodyStrong" style={{ flex: 1 }}>
              Votre cycle de 8 semaines est terminé. Ouvrez l&apos;onglet Plan pour relancer ou
              ajuster votre parcours.
            </Txt>
          </View>
        ) : null}

        {closed ? (
          <Animated.View entering={FadeIn} style={s.closedBanner}>
            <Icon name="check" size={18} color={colors.onBrand} strokeWidth={2.4} />
            <Txt variant="bodyStrong" color={colors.onBrand}>
              Journée clôturée. Reposez-vous.
            </Txt>
          </Animated.View>
        ) : null}

        {occ.length > 0 ? (
          <View style={{ gap: spacing.md }}>
            <View style={s.sectionRow}>
              <Txt variant="subtitle">Vos petits pas</Txt>
              <Txt variant="small" color={colors.muted}>
                {doneCount}/{occ.length} fait{doneCount > 1 ? 's' : ''}
              </Txt>
            </View>
            {allDone && !closed ? (
              <Animated.View entering={FadeIn} style={s.allDoneBanner} testID="all-done-banner">
                <Icon name="sparkle" size={18} color={colors.onBrandPrimary} strokeWidth={2} />
                <Txt variant="bodyStrong" color={colors.onBrandPrimary}>
                  Bravo, tout est fait aujourd&apos;hui !
                </Txt>
              </Animated.View>
            ) : null}
            {visible.map((o) => (
              <ActionCard key={o.id} occ={o} disabled={closed} onToggle={() => onToggle(o)} />
            ))}
            {extra > 0 ? (
              <Txt variant="small" color={colors.muted} center>
                + {extra} autre{extra > 1 ? 's' : ''} action{extra > 1 ? 's' : ''} hors écran
              </Txt>
            ) : null}
          </View>
        ) : !cycleEnded ? (
          <View style={s.empty}>
            <Icon name="leaf" size={40} color={colors.brandPrimary} />
            <Txt variant="subtitle" center style={{ marginTop: spacing.md }}>
              Aucune action prévue aujourd&apos;hui
            </Txt>
            <Txt variant="small" center style={{ marginTop: spacing.xs }}>
              Profitez de votre journée. Un petit pas demain compte déjà.
            </Txt>
          </View>
        ) : null}

        {/* Mood */}
        <View style={s.card}>
          <Txt variant="subtitle" style={{ marginBottom: spacing.md }}>
            Votre humeur
          </Txt>
          <MoodSelector value={dayLog.mood} onChange={(v) => setMood(key, v)} disabled={closed} />
        </View>

        {/* Note */}
        <View style={s.card}>
          <Txt variant="subtitle" style={{ marginBottom: spacing.sm }}>
            Une note ? <Txt variant="small" color={colors.muted}>(facultatif)</Txt>
          </Txt>
          <TextInput
            testID="today-note-input"
            value={dayLog.note ?? ''}
            onChangeText={(t) => setNote(key, t)}
            editable={!closed}
            placeholder="Un mot sur votre journée…"
            placeholderTextColor={colors.muted}
            style={s.noteInput}
            multiline
            textAlignVertical="top"
          />
        </View>
      </KeyboardAwareScrollView>

      <KeyboardStickyView offset={{ closed: 0, opened: insets.bottom }}>
        <View style={[s.footer, { paddingBottom: insets.bottom + spacing.md }]}>
          {closed ? (
            <View style={s.doneBtn} testID="day-closed-state">
              <Icon name="check" size={18} color={colors.muted} strokeWidth={2.2} />
              <Txt variant="subtitle" color={colors.muted}>
                Journée clôturée
              </Txt>
            </View>
          ) : (
            <Button
              testID="close-day-button"
              label="Clôturer ma journée"
              icon="check"
              onPress={() => closeDay(key)}
              haptic="success"
            />
          )}
        </View>
      </KeyboardStickyView>
    </View>
  );
}

function ActionCard({
  occ,
  disabled,
  onToggle,
}: {
  occ: Occurrence;
  disabled: boolean;
  onToggle: () => void;
}) {
  const s = useStyles();
  const { colors } = useTheme();
  const done = occ.status === 'done';
  const missed = occ.status === 'missed';

  const boxColor = done ? colors.brandPrimary : missed ? colors.error : colors.surface;
  const boxBorder = done ? colors.brandPrimary : missed ? colors.error : colors.borderStrong;

  return (
    <Pressable
      testID={`action-card-${occ.actionId}`}
      onPress={onToggle}
      disabled={disabled}
      style={({ pressed }) => [
        s.action,
        {
          borderColor: done ? colors.brandPrimary : colors.border,
          backgroundColor: done ? colors.brandTertiary : colors.surfaceSecondary,
        },
        pressed && { transform: [{ scale: 0.99 }] },
      ]}
    >
      <View style={[s.checkbox, { backgroundColor: boxColor, borderColor: boxBorder }]}>
        {done ? <Icon name="check" size={16} color={colors.onBrand} strokeWidth={2.6} /> : null}
        {missed ? <Icon name="x" size={14} color={colors.onError} strokeWidth={2.4} /> : null}
      </View>
      <View style={{ flex: 1 }}>
        <Txt variant="bodyStrong" color={colors.onSurface}>
          {occ.actionTitle}
        </Txt>
        <Txt variant="small" color={colors.muted}>
          {missed ? 'Non fait' : occ.objectiveTitle}
        </Txt>
      </View>
    </Pressable>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surface },
  header: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: c.divider,
  },
  closedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: c.brandPrimary,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  welcomeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: c.brandTertiary,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  cycleNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: c.surfaceSecondary,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: c.brandPrimary,
  },
  allDoneBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: c.brandPrimary,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.lg,
  },
  checkbox: {
    width: 30,
    height: 30,
    borderRadius: radius.sm,
    borderWidth: 1.6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: { alignItems: 'center', paddingVertical: spacing['2xl'] },
  card: {
    backgroundColor: c.surfaceSecondary,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  noteInput: {
    backgroundColor: c.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    minHeight: 80,
    fontFamily: 'Nunito-Regular',
    fontSize: 15,
    lineHeight: 22,
    color: c.onSurface,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    backgroundColor: c.surface,
    borderTopWidth: 1,
    borderTopColor: c.divider,
  },
  doneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    height: 54,
    borderRadius: radius.lg,
    backgroundColor: c.surfaceTertiary,
  },
}));
