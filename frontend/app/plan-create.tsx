import React, { useState } from 'react';
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
import { PlanObjective } from '@/src/lib/plan';
import { DAY_LABELS_SHORT, DAY_LABELS_FULL } from '@/src/lib/date';
import { PLAN_ACTION_EXAMPLES } from '@/src/data/bilan';

const PLAN_HERO =
  'https://images.unsplash.com/photo-1637689113621-73951984fcc1?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1OTV8MHwxfHNlYXJjaHwxfHxjYWxtJTIwbW9ybmluZyUyMGNvZmZlZSUyMHN1bmxpZ2h0JTIwam91cm5hbHxlbnwwfHx8fDE3ODkyNDc1NjZ8MA&ixlib=rb-4.1.0&q=85';

let counter = 0;
const uid = (p: string) => `${p}-${Date.now()}-${counter++}`;

interface LocalAction {
  id: string;
  title: string;
  days: number[];
}
interface LocalObjective {
  id: string;
  title: string;
  actions: LocalAction[];
}

const newAction = (): LocalAction => ({ id: uid('a'), title: '', days: [] });
const newObjective = (): LocalObjective => ({ id: uid('o'), title: '', actions: [newAction()] });

export default function PlanCreate() {
  const s = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { state, createPlan } = useStore();

  const [ambition, setAmbition] = useState('');
  const [objectives, setObjectives] = useState<LocalObjective[]>([newObjective()]);

  const patchObjective = (id: string, patch: Partial<LocalObjective>) =>
    setObjectives((prev) => prev.map((o) => (o.id === id ? { ...o, ...patch } : o)));

  const patchAction = (objId: string, actId: string, patch: Partial<LocalAction>) =>
    setObjectives((prev) =>
      prev.map((o) =>
        o.id === objId
          ? { ...o, actions: o.actions.map((a) => (a.id === actId ? { ...a, ...patch } : a)) }
          : o
      )
    );

  const toggleDay = (objId: string, actId: string, day: number) => {
    Haptics.selectionAsync();
    setObjectives((prev) =>
      prev.map((o) =>
        o.id === objId
          ? {
              ...o,
              actions: o.actions.map((a) =>
                a.id === actId
                  ? {
                      ...a,
                      days: a.days.includes(day)
                        ? a.days.filter((d) => d !== day)
                        : [...a.days, day].sort((x, y) => x - y),
                    }
                  : a
              ),
            }
          : o
      )
    );
  };

  const addAction = (objId: string) =>
    patchObjective(objId, {
      actions: [...(objectives.find((o) => o.id === objId)?.actions ?? []), newAction()],
    });

  const removeAction = (objId: string, actId: string) =>
    setObjectives((prev) =>
      prev.map((o) =>
        o.id === objId ? { ...o, actions: o.actions.filter((a) => a.id !== actId) } : o
      )
    );

  const addObjective = () => {
    if (objectives.length >= 3) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setObjectives((prev) => [...prev, newObjective()]);
  };

  const removeObjective = (id: string) =>
    setObjectives((prev) => (prev.length <= 1 ? prev : prev.filter((o) => o.id !== id)));

  const cleaned: PlanObjective[] = objectives
    .map((o) => ({
      id: o.id,
      title: o.title.trim(),
      actions: o.actions
        .filter((a) => a.title.trim() && a.days.length)
        .map((a) => ({ id: a.id, title: a.title.trim(), days: a.days })),
    }))
    .filter((o) => o.title && o.actions.length);

  const canCreate = ambition.trim().length > 0 && cleaned.length > 0;

  const onCreate = () => {
    createPlan(ambition.trim(), cleaned);
    router.replace('/(tabs)');
  };

  return (
    <View style={s.root}>
      <KeyboardAwareScrollView
        contentContainerStyle={{ paddingBottom: 130 }}
        bottomOffset={100}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={s.hero}>
          <Image source={{ uri: PLAN_HERO }} style={s.heroImg} contentFit="cover" transition={300} />
          <LinearGradient colors={['rgba(28,31,26,0.15)', 'rgba(28,31,26,0.72)']} style={s.heroScrim} />
          <View style={[s.heroText, { paddingBottom: spacing.lg }]}>
            <Txt variant="overline" color="#FFFFFF">
              Étape finale
            </Txt>
            <Txt variant="display" color="#FFFFFF">
              Construire mon plan
            </Txt>
          </View>
        </View>

        <View style={s.body}>
          {/* Ambition */}
          <View style={s.compass}>
            <View style={s.compassHead}>
              <Icon name="target" size={20} color={colors.brandPrimary} strokeWidth={2} />
              <Txt variant="subtitle">Votre ambition de l'année</Txt>
            </View>
            <Txt variant="small" style={{ marginTop: spacing.xs, marginBottom: spacing.md }}>
              Votre cap. Une phrase simple qui vous guidera.
            </Txt>
            <TextInput
              testID="plan-ambition-input"
              value={ambition}
              onChangeText={setAmbition}
              placeholder="Ex. Retrouver un métier qui a du sens"
              placeholderTextColor={colors.muted}
              style={s.ambitionInput}
              multiline
            />
          </View>

          {objectives.map((obj, oi) => (
            <View key={obj.id} style={s.objCard}>
              <View style={s.objHead}>
                <Txt variant="label" color={colors.brandPrimary}>
                  OBJECTIF {oi + 1}
                </Txt>
                {objectives.length > 1 ? (
                  <Pressable
                    testID={`remove-objective-${oi}`}
                    onPress={() => removeObjective(obj.id)}
                    hitSlop={10}
                  >
                    <Icon name="trash" size={18} color={colors.muted} />
                  </Pressable>
                ) : null}
              </View>
              <TextInput
                testID={`objective-title-${oi}`}
                value={obj.title}
                onChangeText={(t) => patchObjective(obj.id, { title: t })}
                placeholder="Nommez votre objectif"
                placeholderTextColor={colors.muted}
                style={s.objInput}
              />

              {obj.actions.map((act, ai) => (
                <View key={act.id} style={s.actionBlock}>
                  <View style={s.actionRow}>
                    <TextInput
                      testID={`action-title-${oi}-${ai}`}
                      value={act.title}
                      onChangeText={(t) => patchAction(obj.id, act.id, { title: t })}
                      placeholder={`Ex. ${PLAN_ACTION_EXAMPLES[(oi + ai) % PLAN_ACTION_EXAMPLES.length]}`}
                      placeholderTextColor={colors.muted}
                      style={s.actionInput}
                    />
                    {obj.actions.length > 1 ? (
                      <Pressable
                        testID={`remove-action-${oi}-${ai}`}
                        onPress={() => removeAction(obj.id, act.id)}
                        hitSlop={8}
                        style={s.removeAction}
                      >
                        <Icon name="x" size={16} color={colors.muted} />
                      </Pressable>
                    ) : null}
                  </View>
                  <View style={s.daysRow}>
                    {DAY_LABELS_SHORT.map((lbl, d) => {
                      const active = act.days.includes(d);
                      return (
                        <Pressable
                          key={d}
                          testID={`day-${oi}-${ai}-${d}`}
                          accessibilityLabel={DAY_LABELS_FULL[d]}
                          onPress={() => toggleDay(obj.id, act.id, d)}
                          style={[
                            s.dayChip,
                            { backgroundColor: active ? colors.brandPrimary : colors.surface, borderColor: active ? colors.brandPrimary : colors.border },
                          ]}
                        >
                          <Txt
                            variant="label"
                            color={active ? colors.onBrandPrimary : colors.onSurfaceSecondary}
                          >
                            {lbl}
                          </Txt>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              ))}

              <Pressable
                testID={`add-action-${oi}`}
                onPress={() => addAction(obj.id)}
                style={s.addAction}
              >
                <Icon name="plus" size={16} color={colors.brandPrimary} strokeWidth={2} />
                <Txt variant="bodyStrong" color={colors.brandPrimary}>
                  Ajouter une action
                </Txt>
              </Pressable>
            </View>
          ))}

          {objectives.length < 3 ? (
            <Pressable testID="add-objective-button" onPress={addObjective} style={s.addObjective}>
              <Icon name="plus" size={18} color={colors.onSurface} strokeWidth={2} />
              <Txt variant="bodyStrong">Ajouter un objectif</Txt>
            </Pressable>
          ) : null}
        </View>
      </KeyboardAwareScrollView>

      <KeyboardStickyView offset={{ closed: 0, opened: insets.bottom }}>
        <View style={[s.footer, { paddingBottom: insets.bottom + spacing.md }]}>
          <Button
            testID="plan-create-button"
            label="Créer mon plan"
            icon="check"
            onPress={onCreate}
            disabled={!canCreate}
            haptic="medium"
          />
        </View>
      </KeyboardStickyView>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surface },
  hero: { height: 200, width: '100%', justifyContent: 'flex-end' },
  heroImg: { ...StyleSheetAbsolute() },
  heroScrim: { ...StyleSheetAbsolute() },
  heroText: { paddingHorizontal: spacing.xl },
  body: { paddingHorizontal: spacing.xl, paddingTop: spacing.xl, gap: spacing.lg },
  compass: {
    backgroundColor: c.brandTertiary,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  compassHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  ambitionInput: {
    backgroundColor: c.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontFamily: 'Fraunces-Medium',
    fontSize: 17,
    lineHeight: 24,
    color: c.onSurface,
    minHeight: 60,
  },
  objCard: {
    backgroundColor: c.surfaceSecondary,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  objHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  objInput: {
    backgroundColor: c.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontFamily: 'Nunito-Bold',
    fontSize: 16,
    color: c.onSurface,
  },
  actionBlock: {
    backgroundColor: c.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.md,
  },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  actionInput: {
    flex: 1,
    fontFamily: 'Nunito-SemiBold',
    fontSize: 15,
    color: c.onSurface,
    paddingVertical: spacing.xs,
  },
  removeAction: { padding: spacing.xs },
  daysRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dayChip: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
  },
  addObjective: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: c.borderStrong,
    borderStyle: 'dashed',
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    backgroundColor: c.surface,
    borderTopWidth: 1,
    borderTopColor: c.divider,
  },
}));

function StyleSheetAbsolute() {
  return { position: 'absolute' as const, left: 0, right: 0, top: 0, bottom: 0 };
}
