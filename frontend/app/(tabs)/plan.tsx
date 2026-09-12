import React from 'react';
import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { makeStyles, radius, spacing, useTheme } from '@/src/theme';
import { Txt } from '@/src/components/Txt';
import { Button } from '@/src/components/Button';
import { Icon } from '@/src/components/Icon';
import { useStore } from '@/src/store/AppStore';
import { DAY_LABELS_SHORT } from '@/src/lib/date';
import { fromKey } from '@/src/lib/date';

export default function PlanTab() {
  const s = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { state } = useStore();
  const plan = state.plan;

  if (!plan) {
    return (
      <View style={s.root}>
        <View style={[s.header, { paddingTop: insets.top + spacing.md }]}>
          <Txt variant="display">Plan</Txt>
        </View>
        <View style={s.empty}>
          <Icon name="target" size={40} color={colors.brandPrimary} />
          <Txt variant="subtitle" center style={{ marginTop: spacing.md }}>
            Aucun plan actif
          </Txt>
          <Txt variant="small" center style={{ marginTop: spacing.xs, marginBottom: spacing.xl }}>
            Transformez votre bilan en petites actions concrètes.
          </Txt>
          <Button
            testID="create-plan-cta"
            label="Créer mon plan"
            icon="plus"
            fullWidth={false}
            onPress={() => router.push('/plan-create')}
          />
        </View>
      </View>
    );
  }

  const createdDate = new Date(plan.createdAt);
  const totalActions = plan.objectives.reduce((n, o) => n + o.actions.length, 0);

  return (
    <View style={s.root}>
      <View style={[s.header, { paddingTop: insets.top + spacing.md }]}>
        <Txt variant="display">Plan</Txt>
        <Txt variant="small" color={colors.muted}>
          {plan.objectives.length} objectif{plan.objectives.length > 1 ? 's' : ''} ·{' '}
          {totalActions} action{totalActions > 1 ? 's' : ''} · 8 semaines
        </Txt>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: spacing.xl, paddingBottom: spacing['2xl'], gap: spacing.lg }}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.compass}>
          <View style={s.compassHead}>
            <Icon name="target" size={18} color={colors.brandPrimary} strokeWidth={2} />
            <Txt variant="overline" color={colors.brandPrimary}>
              Ambition de l'année
            </Txt>
          </View>
          <Txt variant="title" style={{ marginTop: spacing.sm }}>
            {plan.ambition}
          </Txt>
        </View>

        {plan.objectives.map((obj, i) => (
          <View key={obj.id} style={s.objCard} testID={`plan-objective-${i}`}>
            <Txt variant="label" color={colors.brandPrimary}>
              OBJECTIF {i + 1}
            </Txt>
            <Txt variant="subtitle" style={{ marginTop: spacing.xs }}>
              {obj.title}
            </Txt>
            <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
              {obj.actions.map((a) => (
                <View key={a.id} style={s.actionRow}>
                  <View style={s.bullet} />
                  <View style={{ flex: 1 }}>
                    <Txt variant="bodyStrong">{a.title}</Txt>
                    <View style={s.daysRow}>
                      {DAY_LABELS_SHORT.map((lbl, d) => {
                        const active = a.days.includes(d);
                        return (
                          <View
                            key={d}
                            style={[
                              s.dayDot,
                              {
                                backgroundColor: active ? colors.brandPrimary : 'transparent',
                                borderColor: active ? colors.brandPrimary : colors.border,
                              },
                            ]}
                          >
                            <Txt
                              variant="overline"
                              color={active ? colors.onBrandPrimary : colors.muted}
                            >
                              {lbl}
                            </Txt>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        ))}

        <View style={s.note}>
          <Icon name="info" size={16} color={colors.muted} />
          <Txt variant="small" color={colors.muted} style={{ flex: 1 }}>
            Créé le {createdDate.getDate()}/{createdDate.getMonth() + 1}. Votre plan couvre 8
            semaines de petits pas.
          </Txt>
        </View>
      </ScrollView>
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
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl },
  compass: { backgroundColor: c.brandTertiary, borderRadius: radius.lg, padding: spacing.lg },
  compassHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  objCard: { backgroundColor: c.surfaceSecondary, borderRadius: radius.lg, padding: spacing.lg },
  actionRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  bullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: c.brandSecondary,
    marginTop: 7,
  },
  daysRow: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.sm, flexWrap: 'wrap' },
  dayDot: {
    width: 26,
    height: 26,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  note: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
  },
}));
