import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { storage } from '@/src/utils/storage';
import {
  generateOccurrences,
  Occurrence,
  Plan,
  PlanObjective,
} from '@/src/lib/plan';
import { daysBetween, todayKey } from '@/src/lib/date';

const STORAGE_KEY = 'childeric:v1';

export interface Settings {
  firstName: string;
  reminderTime: string;
  timezone: string;
  reminderEnabled?: boolean;
  lastSeenKey?: string;
}

export interface Bilan {
  status: 'draft' | 'frozen';
  answers: Record<string, string>;
  frozenAt?: string;
}

export interface DayLog {
  mood?: number;
  note?: string;
  closed?: boolean;
  closedAt?: string;
}

export interface AppState {
  settings: Settings | null;
  bilan: Bilan;
  plan: Plan | null;
  occurrences: Occurrence[];
  journal: Record<string, DayLog>;
  celebratedBadgeIds: string[];
  hasComeback: boolean;
}

const EMPTY_STATE: AppState = {
  settings: null,
  bilan: { status: 'draft', answers: {} },
  plan: null,
  occurrences: [],
  journal: {},
  celebratedBadgeIds: [],
  hasComeback: false,
};

interface StoreValue {
  ready: boolean;
  state: AppState;
  saveSettings: (s: Settings) => void;
  setAnswer: (qid: string, value: string) => void;
  freezeBilan: () => void;
  createPlan: (ambition: string, objectives: PlanObjective[]) => void;
  startNewCycle: (ambition?: string, objectives?: PlanObjective[]) => void;
  toggleOccurrence: (id: string) => void;
  setMood: (dateKey: string, mood: number) => void;
  setNote: (dateKey: string, note: string) => void;
  closeDay: (dateKey: string) => void;
  occurrencesForDate: (dateKey: string) => Occurrence[];
  touchLastSeen: () => number;
  markBadgesSeen: (ids: string[]) => void;
  buildExport: () => object;
  buildSummary: () => string;
  deleteAll: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

export function AppStoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(EMPTY_STATE);
  const [ready, setReady] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    (async () => {
      const saved = await storage.getJSON<AppState>(STORAGE_KEY);
      if (saved) {
        setState({
          ...EMPTY_STATE,
          ...saved,
          bilan: saved.bilan ?? EMPTY_STATE.bilan,
          celebratedBadgeIds: saved.celebratedBadgeIds ?? [],
          hasComeback: saved.hasComeback ?? false,
        });
      }
      loaded.current = true;
      setReady(true);
    })();
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    storage.setJSON(STORAGE_KEY, state);
  }, [state]);

  const value = useMemo<StoreValue>(() => {
    return {
      ready,
      state,
      saveSettings: (s) => setState((prev) => ({ ...prev, settings: s })),
      setAnswer: (qid, val) =>
        setState((prev) => ({
          ...prev,
          bilan: { ...prev.bilan, answers: { ...prev.bilan.answers, [qid]: val } },
        })),
      freezeBilan: () =>
        setState((prev) => ({
          ...prev,
          bilan: {
            ...prev.bilan,
            status: 'frozen',
            frozenAt: new Date().toISOString(),
          },
        })),
      createPlan: (ambition, objectives) =>
        setState((prev) => {
          const plan: Plan = {
            ambition,
            objectives,
            createdAt: new Date().toISOString(),
            startKey: todayKey(),
          };
          return { ...prev, plan, occurrences: generateOccurrences(plan) };
        }),
      startNewCycle: (ambition, objectives) =>
        setState((prev) => {
          if (!prev.plan) return prev;
          const nextPlan: Plan = {
            ambition: ambition ?? prev.plan.ambition,
            objectives: objectives ?? prev.plan.objectives,
            createdAt: prev.plan.createdAt,
            startKey: todayKey(),
            cyclesCompleted: (prev.plan.cyclesCompleted ?? 0) + 1,
          };
          const newOcc = generateOccurrences(nextPlan);
          return { ...prev, plan: nextPlan, occurrences: [...prev.occurrences, ...newOcc] };
        }),
      toggleOccurrence: (id) =>
        setState((prev) => {
          const target = prev.occurrences.find((o) => o.id === id);
          if (!target) return prev;
          if (prev.journal[target.date]?.closed) return prev;
          return {
            ...prev,
            occurrences: prev.occurrences.map((o) =>
              o.id === id
                ? { ...o, status: o.status === 'done' ? 'pending' : 'done' }
                : o
            ),
          };
        }),
      setMood: (dateKey, mood) =>
        setState((prev) => ({
          ...prev,
          journal: {
            ...prev.journal,
            [dateKey]: { ...prev.journal[dateKey], mood },
          },
        })),
      setNote: (dateKey, note) =>
        setState((prev) => ({
          ...prev,
          journal: {
            ...prev.journal,
            [dateKey]: { ...prev.journal[dateKey], note },
          },
        })),
      closeDay: (dateKey) =>
        setState((prev) => ({
          ...prev,
          occurrences: prev.occurrences.map((o) =>
            o.date === dateKey && o.status === 'pending'
              ? { ...o, status: 'missed' }
              : o
          ),
          journal: {
            ...prev.journal,
            [dateKey]: {
              ...prev.journal[dateKey],
              closed: true,
              closedAt: new Date().toISOString(),
            },
          },
        })),
      occurrencesForDate: (dateKey) =>
        state.occurrences.filter((o) => o.date === dateKey),
      touchLastSeen: () => {
        const prevKey = state.settings?.lastSeenKey;
        const today = todayKey();
        let daysAbsent = 0;
        if (prevKey && prevKey !== today) {
          daysAbsent = daysBetween(prevKey, today);
        }
        if (prevKey !== today) {
          setState((prev) => ({
            ...prev,
            settings: prev.settings ? { ...prev.settings, lastSeenKey: today } : prev.settings,
            hasComeback: prev.hasComeback || daysAbsent >= 2,
          }));
        }
        return daysAbsent;
      },
      markBadgesSeen: (ids) =>
        setState((prev) => ({
          ...prev,
          celebratedBadgeIds: Array.from(new Set([...prev.celebratedBadgeIds, ...ids])),
        })),
      buildExport: () => ({
        app: 'Childeric',
        exportedAt: new Date().toISOString(),
        settings: state.settings,
        bilan: state.bilan,
        plan: state.plan,
        journal: state.journal,
        occurrences: state.occurrences,
      }),
      buildSummary: () => buildSummaryText(state),
      deleteAll: () => {
        storage.removeItem(STORAGE_KEY);
        setState(EMPTY_STATE);
      },
    };
  }, [state, ready]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within AppStoreProvider');
  return ctx;
}

function buildSummaryText(state: AppState): string {
  const name = state.settings?.firstName || 'Moi';
  const lines: string[] = [];
  lines.push(`Mon bilan Childeric — ${name}`);
  lines.push('');
  if (state.plan) {
    lines.push(`Ambition de l'année : ${state.plan.ambition}`);
    lines.push('');
    state.plan.objectives.forEach((o, i) => {
      lines.push(`Objectif ${i + 1} : ${o.title}`);
      o.actions.forEach((a) => lines.push(`  • ${a.title}`));
    });
    lines.push('');
  }
  const closed = Object.values(state.journal).filter((d) => d.closed).length;
  const done = state.occurrences.filter((o) => o.status === 'done').length;
  const missed = state.occurrences.filter((o) => o.status === 'missed').length;
  lines.push('Ma constance');
  lines.push(`  Journées clôturées : ${closed}`);
  lines.push(`  Petits pas faits : ${done}`);
  lines.push(`  Non faits : ${missed}`);
  lines.push('');
  lines.push('Envoyé depuis Childeric — mes données restent sur mon téléphone.');
  return lines.join('\n');
}
