import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  KeyboardAwareScrollView,
  KeyboardStickyView,
} from 'react-native-keyboard-controller';
import Animated, { FadeIn, FadeInDown, FadeOut } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet';
import { makeStyles, radius, spacing, useTheme } from '@/src/theme';
import { Txt } from '@/src/components/Txt';
import { Button } from '@/src/components/Button';
import { Icon } from '@/src/components/Icon';
import { useStore } from '@/src/store/AppStore';
import { BILAN_QUESTIONS, BILAN_SECTIONS, BilanSection } from '@/src/data/bilan';

const SECONDS_PER_QUESTION = 22;

export default function BilanScreen() {
  const s = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { state, setAnswer, freezeBilan } = useStore();
  const sheetRef = useRef<BottomSheetModal>(null);

  const total = BILAN_QUESTIONS.length;
  const firstUnanswered = useMemo(() => {
    const idx = BILAN_QUESTIONS.findIndex((q) => !(state.bilan.answers[q.id]?.trim()));
    return idx < 0 ? 0 : idx;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [index, setIndex] = useState(firstUnanswered);
  const [celebrateSection, setCelebrateSection] = useState<string | null>(null);

  const q = BILAN_QUESTIONS[index];
  const section = BILAN_SECTIONS.find((sec) => index >= sec.from && index < sec.from + sec.count)!;
  const sectionNumber = BILAN_SECTIONS.indexOf(section) + 1;
  const value = state.bilan.answers[q.id] ?? '';
  const isLast = index === total - 1;
  const minutesLeft = Math.max(1, Math.ceil(((total - index - 1) * SECONDS_PER_QUESTION) / 60));

  const answeredInSection = (sec: BilanSection) =>
    BILAN_QUESTIONS.slice(sec.from, sec.from + sec.count).filter((qq) =>
      state.bilan.answers[qq.id]?.trim()
    ).length;

  const jumpToSection = (sec: BilanSection) => {
    Haptics.selectionAsync();
    const firstUnansweredInSection = BILAN_QUESTIONS.findIndex(
      (qq, i) => i >= sec.from && i < sec.from + sec.count && !state.bilan.answers[qq.id]?.trim()
    );
    setIndex(firstUnansweredInSection >= 0 ? firstUnansweredInSection : sec.from);
    sheetRef.current?.dismiss();
  };

  const goNext = () => {
    Haptics.selectionAsync();
    if (isLast) {
      freezeBilan();
      router.replace('/plan-create');
      return;
    }
    const isLastOfSection = index === section.from + section.count - 1;
    if (isLastOfSection) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setCelebrateSection(section.title);
      setTimeout(() => setCelebrateSection(null), 1800);
    }
    setIndex((i) => Math.min(total - 1, i + 1));
  };
  const goPrev = () => {
    if (index === 0) return;
    Haptics.selectionAsync();
    setIndex((i) => Math.max(0, i - 1));
  };

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.4} />
    ),
    []
  );

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
          <View style={s.segmentsRow}>
            {BILAN_SECTIONS.map((sec) => {
              const filled = Math.max(0, Math.min(1, (index + 1 - sec.from) / sec.count));
              return (
                <View key={sec.key} style={[s.segmentTrack, { flex: sec.count }]}>
                  <View style={[s.segmentFill, { width: `${filled * 100}%` }]} />
                </View>
              );
            })}
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
        <Pressable
          testID="bilan-overview-button"
          onPress={() => sheetRef.current?.present()}
          style={s.overviewBtn}
        >
          <Icon name="sliders" size={14} color={colors.muted} strokeWidth={1.8} />
          <Txt variant="small" color={colors.muted}>
            Vue d&apos;ensemble · ~{minutesLeft} min restantes
          </Txt>
          <Icon name="chevron-right" size={14} color={colors.muted} />
        </Pressable>
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

      {celebrateSection ? (
        <Animated.View
          entering={FadeInDown}
          exiting={FadeOut}
          style={[s.celebrateToast, { bottom: insets.bottom + 96 }]}
          testID="section-celebration-toast"
        >
          <Icon name="sparkle" size={16} color={colors.onBrandPrimary} strokeWidth={2} />
          <Txt variant="bodyStrong" color={colors.onBrandPrimary}>
            Section « {celebrateSection} » terminée
          </Txt>
        </Animated.View>
      ) : null}

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
              label={isLast ? 'Terminer' : value.trim() ? 'Continuer' : 'Passer'}
              icon={isLast ? 'check' : 'arrow-right'}
              onPress={goNext}
              haptic={isLast ? 'success' : 'light'}
            />
          </View>
        </View>
      </KeyboardStickyView>

      <BottomSheetModal
        ref={sheetRef}
        snapPoints={['70%']}
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={{ backgroundColor: colors.borderStrong }}
        backgroundStyle={{ backgroundColor: colors.surface }}
      >
        <BottomSheetScrollView
          style={{ paddingHorizontal: spacing.xl }}
          contentContainerStyle={{ paddingTop: spacing.md, paddingBottom: insets.bottom + spacing.xl }}
        >
          <Txt variant="title" style={{ marginBottom: spacing.xs }}>
            Vue d&apos;ensemble
          </Txt>
          <Txt variant="small" color={colors.muted} style={{ marginBottom: spacing.lg }}>
            Avancez dans l&apos;ordre qui vous convient. Touchez une section pour y aller.
          </Txt>
          {BILAN_SECTIONS.map((item, i) => {
            const answered = answeredInSection(item);
            const done = answered === item.count;
            const isCurrent = item === section;
            return (
              <Pressable
                key={item.key}
                testID={`overview-section-${i}`}
                onPress={() => jumpToSection(item)}
                style={[s.overviewRow, isCurrent && { borderColor: colors.brandPrimary }]}
              >
                <View
                  style={[
                    s.overviewBadge,
                    { backgroundColor: done ? colors.brandPrimary : colors.surfaceTertiary },
                  ]}
                >
                  {done ? (
                    <Icon name="check" size={14} color={colors.onBrandPrimary} strokeWidth={2.4} />
                  ) : (
                    <Txt variant="label" color={colors.muted}>
                      {i + 1}
                    </Txt>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Txt variant="bodyStrong">{item.title}</Txt>
                  <Txt variant="small" color={colors.muted}>
                    {item.part === 'personnel' ? 'Personnel' : 'Professionnel'} · {answered}/
                    {item.count} répondu{answered > 1 ? 's' : ''}
                  </Txt>
                </View>
                <Icon name="chevron-right" size={18} color={colors.muted} />
              </Pressable>
            );
          })}
        </BottomSheetScrollView>
      </BottomSheetModal>
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
  segmentsRow: { flex: 1, flexDirection: 'row', gap: 3 },
  segmentTrack: {
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: c.surfaceTertiary,
    overflow: 'hidden',
  },
  segmentFill: { height: '100%', borderRadius: radius.pill, backgroundColor: c.brandPrimary },
  headerMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  overviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
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
  celebrateToast: {
    position: 'absolute',
    left: spacing.xl,
    right: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: c.brandPrimary,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  overviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: c.surfaceSecondary,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'transparent',
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  overviewBadge: {
    width: 30,
    height: 30,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
