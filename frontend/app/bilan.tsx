import React, { useMemo, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  KeyboardAwareScrollView,
  KeyboardStickyView,
} from 'react-native-keyboard-controller';
import Animated, { FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { makeStyles, radius, spacing, useTheme } from '@/src/theme';
import { Txt } from '@/src/components/Txt';
import { Button } from '@/src/components/Button';
import { Icon } from '@/src/components/Icon';
import { useStore } from '@/src/store/AppStore';
import { BILAN_QUESTIONS, BILAN_SECTIONS } from '@/src/data/bilan';

export default function BilanScreen() {
  const s = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { state, setAnswer, freezeBilan } = useStore();

  const total = BILAN_QUESTIONS.length;
  const firstUnanswered = useMemo(() => {
    const idx = BILAN_QUESTIONS.findIndex((q) => !(state.bilan.answers[q.id]?.trim()));
    return idx < 0 ? 0 : idx;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [index, setIndex] = useState(firstUnanswered);

  const q = BILAN_QUESTIONS[index];
  const section = BILAN_SECTIONS.find((sec) => index >= sec.from && index < sec.from + sec.count)!;
  const sectionNumber = BILAN_SECTIONS.indexOf(section) + 1;
  const value = state.bilan.answers[q.id] ?? '';
  const isLast = index === total - 1;
  const progress = (index + 1) / total;

  const goNext = () => {
    Haptics.selectionAsync();
    if (isLast) {
      freezeBilan();
      router.replace('/plan-create');
      return;
    }
    setIndex((i) => Math.min(total - 1, i + 1));
  };
  const goPrev = () => {
    if (index === 0) return;
    Haptics.selectionAsync();
    setIndex((i) => Math.max(0, i - 1));
  };

  return (
    <View style={s.root}>
      <View style={[s.header, { paddingTop: insets.top + spacing.md }]}>
        <View style={s.headerTop}>
          <Pressable
            testID="bilan-back-button"
            onPress={goPrev}
            disabled={index === 0}
            style={[s.iconBtn, { opacity: index === 0 ? 0.3 : 1 }]}
            hitSlop={10}
          >
            <Icon name="chevron-left" size={22} color={colors.onSurface} />
          </Pressable>
          <View style={s.progressTrack}>
            <View style={[s.progressFill, { width: `${progress * 100}%` }]} />
          </View>
          <Txt variant="small" color={colors.muted}>
            {index + 1}/{total}
          </Txt>
        </View>
        <View style={s.headerMeta}>
          <Txt variant="overline" color={colors.brandPrimary}>
            {q.part === 'personnel' ? 'Bilan personnel' : 'Bilan professionnel'}
          </Txt>
          <Txt variant="small" color={colors.muted}>
            Section {sectionNumber} · {section.title}
          </Txt>
        </View>
      </View>

      <KeyboardAwareScrollView
        contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: 130 }}
        bottomOffset={100}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View key={q.id} entering={FadeIn.duration(260)}>
          <Txt variant="title" testID="bilan-question-label">
            {q.label}
          </Txt>
          {q.help ? (
            <Txt variant="small" style={{ marginTop: spacing.sm }}>
              {q.help}
            </Txt>
          ) : null}
          <TextInput
            testID="bilan-answer-input"
            value={value}
            onChangeText={(t) => setAnswer(q.id, t)}
            placeholder="Prenez le temps d'écrire…"
            placeholderTextColor={colors.muted}
            style={[s.input, q.type === 'long' && s.inputLong]}
            multiline={q.type === 'long'}
            textAlignVertical={q.type === 'long' ? 'top' : 'center'}
            autoFocus={false}
          />
          <Txt variant="small" color={colors.muted} style={{ marginTop: spacing.md }}>
            Vous pouvez laisser vide et y revenir plus tard.
          </Txt>
        </Animated.View>
      </KeyboardAwareScrollView>

      <KeyboardStickyView offset={{ closed: 0, opened: insets.bottom }}>
        <View style={[s.footer, { paddingBottom: insets.bottom + spacing.md }]}>
          <View style={{ flex: 1 }}>
            <Button
              testID="bilan-prev-button"
              label="Précédent"
              variant="secondary"
              onPress={goPrev}
              disabled={index === 0}
            />
          </View>
          <View style={{ flex: 1.3 }}>
            <Button
              testID="bilan-next-button"
              label={isLast ? 'Terminer' : 'Continuer'}
              icon={isLast ? 'check' : 'arrow-right'}
              onPress={goNext}
              haptic={isLast ? 'success' : 'light'}
            />
          </View>
        </View>
      </KeyboardStickyView>
    </View>
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
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconBtn: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  progressTrack: {
    flex: 1,
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: c.surfaceTertiary,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: radius.pill, backgroundColor: c.brandPrimary },
  headerMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  input: {
    marginTop: spacing.xl,
    backgroundColor: c.surfaceTertiary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontFamily: 'Nunito-Regular',
    fontSize: 16,
    lineHeight: 24,
    color: c.onSurface,
  },
  inputLong: { minHeight: 150 },
  footer: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    backgroundColor: c.surface,
    borderTopWidth: 1,
    borderTopColor: c.divider,
  },
}));
