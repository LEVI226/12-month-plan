import React, { useMemo } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { makeStyles, radius, spacing, useTheme } from '@/src/theme';
import { Txt } from '@/src/components/Txt';
import { Icon } from '@/src/components/Icon';
import { MOOD_LABELS } from '@/src/components/MoodSelector';
import { useStore } from '@/src/store/AppStore';
import {
  addDays,
  DAY_LABELS_SHORT,
  fromKey,
  startOfWeek,
  toKey,
  todayKey,
} from '@/src/lib/date';

interface DayInfo {
  total: number;
  done: number;
  missed: number;
}

export default function Suivi() {
  const s = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { state } = useStore();

  const tKey = todayKey();

  const byDate = useMemo(() => {
    const map: Record<string, DayInfo> = {};
    for (const o of state.occurrences) {
      const d = (map[o.date] ??= { total: 0, done: 0, missed: 0 });
      d.total += 1;
      if (o.status === 'done') d.done += 1;
      if (o.status === 'missed') d.missed += 1;
    }
    return map;
  }, [state.occurrences]);

  const closedDays = Object.values(state.journal).filter((d) => d.closed).length;
  const doneTotal = state.occurrences.filter((o) => o.status === 'done').length;
  const missedTotal = state.occurrences.filter((o) => o.status === 'missed').length;
  const moods = Object.values(state.journal)
    .map((d) => d.mood)
    .filter((m): m is number => typeof m === 'number');
  const avgMood = moods.length ? moods.reduce((a, b) => a + b, 0) / moods.length : 0;

  const streak = useMemo(() => {
    let count = 0;
    let d = new Date();
    if (!state.journal[toKey(d)]?.closed) d = addDays(d, -1);
    while (state.journal[toKey(d)]?.closed) {
      count += 1;
      d = addDays(d, -1);
    }
    return count;
  }, [state.journal]);

  const cellColor = (dateKey: string): string => {
    const info = byDate[dateKey];
    const isFuture = dateKey > tKey;
    const closed = !!state.journal[dateKey]?.closed;
    if (isFuture) return colors.surfaceTertiary;
    if (!info || info.total === 0) return colors.surfaceTertiary;
    if (info.done === info.total) return colors.brandPrimary;
    if (info.done > 0) return colors.info;
    return closed ? colors.error : colors.surfaceTertiary;
  };

  // Current week (Mon..Sun)
  const weekStart = startOfWeek(new Date());
  const weekKeys = Array.from({ length: 7 }, (_, i) => toKey(addDays(weekStart, i)));

  // 8-week grid from plan start
  const weeks: string[][] = [];
  if (state.plan) {
    const start = startOfWeek(fromKey(state.plan.startKey));
    for (let w = 0; w < 8; w++) {
      weeks.push(Array.from({ length: 7 }, (_, d) => toKey(addDays(start, w * 7 + d))));
    }
  }

  const resume =
    closedDays === 0
      ? 'Clôturez votre première journée pour voir votre constance grandir.'
      : streak === 0
        ? 'Vous avez fait une pause, c\'est normal. Reprenez à votre rythme, un petit pas aujourd\'hui.'
        : `Belle régularité. ${streak} jour${streak > 1 ? 's' : ''} d'affilée, continuez doucement.`;

  return (
    <View style={s.root}>
      <View style={[s.header, { paddingTop: insets.top + spacing.md }]}>
        <Txt variant="display">Suivi</Txt>
        <Txt variant="small" color={colors.muted}>Votre constance, sans jugement.</Txt>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: spacing.xl, paddingBottom: spacing['2xl'], gap: spacing.lg }}
        showsVerticalScrollIndicator={false}
      >
        {/* Resume message */}
        <View style={s.resume}>
          <Icon name="flame" size={22} color={colors.brandPrimary} strokeWidth={2} />
          <Txt variant="bodyStrong" style={{ flex: 1 }} color={colors.onSurface}>
            {resume}
          </Txt>
        </View>

        {/* Stats */}
        <View style={s.statsRow}>
          <Stat label="Jours clôturés" value={closedDays} />
          <Stat label="Série actuelle" value={streak} suffix="j" />
        </View>
        <View style={s.statsRow}>
          <Stat label="Petits pas faits" value={doneTotal} />
          <Stat label="Non faits" value={missedTotal} tone="soft" />
        </View>

        {/* This week */}
        <View style={s.card}>
          <Txt variant="subtitle" style={{ marginBottom: spacing.md }}>
            Cette semaine
          </Txt>
          <View style={s.weekRow}>
            {weekKeys.map((k, i) => {
              const isToday = k === tKey;
              return (
                <View key={k} style={s.weekCell}>
                  <View
                    style={[
                      s.weekDot,
                      { backgroundColor: cellColor(k) },
                      isToday && { borderWidth: 2, borderColor: colors.onSurface },
                    ]}
                  />
                  <Txt variant="overline" color={colors.muted}>
                    {DAY_LABELS_SHORT[i]}
                  </Txt>
                </View>
              );
            })}
          </View>
        </View>

        {/* 8 weeks */}
        {weeks.length > 0 ? (
          <View style={s.card}>
            <Txt variant="subtitle" style={{ marginBottom: spacing.md }}>
              Sur 8 semaines
            </Txt>
            <View style={{ gap: 6 }}>
              {weeks.map((wk, wi) => (
                <View key={wi} style={s.gridRow}>
                  {wk.map((k) => (
                    <View key={k} style={[s.gridCell, { backgroundColor: cellColor(k) }]} />
                  ))}
                </View>
              ))}
            </View>
            <View style={s.legend}>
              <LegendDot color={colors.brandPrimary} label="Tout fait" />
              <LegendDot color={colors.info} label="En partie" />
              <LegendDot color={colors.error} label="Non fait" />
              <LegendDot color={colors.surfaceTertiary} label="Repos" />
            </View>
          </View>
        ) : null}

        {/* Mood */}
        <View style={s.card}>
          <Txt variant="subtitle" style={{ marginBottom: spacing.xs }}>
            Votre humeur moyenne
          </Txt>
          {moods.length ? (
            <Txt variant="body">
              {MOOD_LABELS[Math.round(avgMood) - 1]} · sur {moods.length} journée
              {moods.length > 1 ? 's' : ''}
            </Txt>
          ) : (
            <Txt variant="small" color={colors.muted}>
              Renseignez votre humeur pour la voir apparaître ici.
            </Txt>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function Stat({
  label,
  value,
  suffix,
  tone,
}: {
  label: string;
  value: number;
  suffix?: string;
  tone?: 'soft';
}) {
  const s = useStyles();
  const { colors } = useTheme();
  return (
    <View style={s.statCard}>
      <Txt
        style={{ fontFamily: 'Fraunces-SemiBold', fontSize: 30, lineHeight: 36 }}
        color={tone === 'soft' ? colors.brandSecondary : colors.brandPrimary}
      >
        {value}
        {suffix ? <Txt style={{ fontFamily: 'Fraunces-Medium', fontSize: 18 }} color={colors.muted}>{suffix}</Txt> : null}
      </Txt>
      <Txt variant="small" color={colors.muted}>
        {label}
      </Txt>
    </View>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
      <View style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: color, borderWidth: 1, borderColor: colors.border }} />
      <Txt variant="small" color={colors.muted}>
        {label}
      </Txt>
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
  resume: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: c.brandTertiary,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  statsRow: { flexDirection: 'row', gap: spacing.md },
  statCard: {
    flex: 1,
    backgroundColor: c.surfaceSecondary,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  card: { backgroundColor: c.surfaceSecondary, borderRadius: radius.lg, padding: spacing.lg },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between' },
  weekCell: { alignItems: 'center', gap: spacing.sm },
  weekDot: { width: 30, height: 30, borderRadius: radius.pill },
  gridRow: { flexDirection: 'row', gap: 6, justifyContent: 'space-between' },
  gridCell: { flex: 1, aspectRatio: 1, borderRadius: 4, maxWidth: 34 },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
}));
