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
import { BILAN_QUESTIONS } from '@/src/data/bilan';
import { createPersistence } from '@/src/lib/persistence';
import { AppState as NativeAppState } from 'react-native';

const SAVE_DEBOUNCE_MS = 300;

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
  bilans: Bilan[];
  plan: Plan | null;
  occurrences: Occurrence[];
  journal: Record<string, DayLog>;
  celebratedBadgeIds: string[];
  hasComeback: boolean;
}

const EMPTY_STATE: AppState = {
  settings: null,
  bilan: { status: 'draft', answers: {} },
  bilans: [],
  plan: null,
  occurrences: [],
  journal: {},
  celebratedBadgeIds: [],
  hasComeback: false,
};

function withDefaults(saved: Partial<AppState> | null | undefined): AppState {
  if (!saved) return EMPTY_STATE;
  return {
    ...EMPTY_STATE,
    ...saved,
    bilan: saved.bilan ?? EMPTY_STATE.bilan,
    bilans: saved.bilans ?? (saved.bilan ? [saved.bilan] : []),
    celebratedBadgeIds: saved.celebratedBadgeIds ?? [],
    hasComeback: saved.hasComeback ?? false,
  };
}

interface StoreValue {
  ready: boolean;
  state: AppState;
  restoreMessage: string | null;
  dismissRestoreMessage: () => void;
  saveError: boolean;
  saveSettings: (s: Settings) => void;
  setAnswer: (qid: string, value: string) => void;
  freezeBilan: () => void;
  newBilan: () => void;
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
  deleteAll: () => Promise<boolean>;
}

const StoreContext = createContext<StoreValue | null>(null);

export function AppStoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(EMPTY_STATE);
  const [ready, setReady] = useState(false);
  const [restoreMessage, setRestoreMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState(false);
  const loaded = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingState = useRef<AppState | null>(null);
  const persistence = useRef(createPersistence(storage, (raw): AppState => {
    const saved = JSON.parse(raw);
    if (!saved || typeof saved !== 'object' || Array.isArray(saved) ||
        !saved.bilan || typeof saved.bilan.answers !== 'object' || !saved.bilan.answers ||
        !['draft', 'frozen'].includes(saved.bilan.status) ||
        !Array.isArray(saved.occurrences) || !saved.journal || typeof saved.journal !== 'object' ||
        Object.values(saved.bilan.answers).some(value => typeof value !== 'string')) {
      throw new Error('Sauvegarde invalide');
    }
    return withDefaults(saved);
  }));
  const deleting = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const result = await persistence.current.load();
        setState(result.state ?? EMPTY_STATE);
        setRestoreMessage(result.message);
        loaded.current = true;
      } catch {
        setSaveError(true);
        setRestoreMessage('Lecture impossible. Vos données ne seront pas écrasées. Relancez l’application pour réessayer.');
      }
      setReady(true);
    })();
  }, []);

  useEffect(() => {
    if (!loaded.current || deleting.current || state === EMPTY_STATE) return;
    pendingState.current = state;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const toSave = pendingState.current;
      saveTimer.current = null;
      if (toSave) persist(toSave);
    }, SAVE_DEBOUNCE_MS);
    return () => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
        saveTimer.current = null;
      }
    };
  }, [state]);

  const persist = async (toSave: AppState) => {
    try {
      await persistence.current.save({ ...toSave, bilans: [...toSave.bilans.slice(0, -1), toSave.bilan] });
      setSaveError(false);
    } catch {
      setSaveError(true);
    }
  };

  useEffect(() => {
    const subscription = NativeAppState.addEventListener('change', status => {
      if (status === 'active' || deleting.current || !pendingState.current || !loaded.current) return;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = null;
      void persist(pendingState.current);
    });
    return () => subscription.remove();
  }, []);

  const value = useMemo<StoreValue>(() => {
    return {
      ready,
      state,
      restoreMessage,
      dismissRestoreMessage: () => setRestoreMessage(null),
      saveError,
      saveSettings: (s) => setState((prev) => ({ ...prev, settings: s })),
      setAnswer: (qid, val) =>
        setState((prev) => prev.bilan.status === 'frozen' ? prev : ({
          ...prev,
          bilan: { ...prev.bilan, answers: { ...prev.bilan.answers, [qid]: val } },
        })),
      newBilan: () => setState(prev => {
        if (prev.bilan.status !== 'frozen') return prev;
        const bilan: Bilan = { status: 'draft', answers: {} };
        return { ...prev, bilan, bilans: [...prev.bilans.slice(0, -1), prev.bilan, bilan] };
      }),
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
          return { ...prev, plan: nextPlan, occurrences: [...prev.occurrences.filter(o => o.date < nextPlan.startKey), ...newOcc] };
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
        bilans: [...state.bilans.slice(0, -1), state.bilan],
        questions: BILAN_QUESTIONS.map(({ id, label, section }) => ({ id, label, section })),
        plan: state.plan,
        journal: state.journal,
        occurrences: state.occurrences,
      }),
      buildSummary: () => buildSummaryText(state),
      deleteAll: async () => {
        deleting.current = true;
        if (saveTimer.current) {
          clearTimeout(saveTimer.current);
          saveTimer.current = null;
        }
        pendingState.current = null;
        try {
          await persistence.current.clear();
          setState(EMPTY_STATE);
          setSaveError(false);
          return true;
        } catch {
          return false;
        } finally {
          deleting.current = false;
        }
      },
    };
  }, [state, ready, restoreMessage, saveError]);

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
  lines.push('Envoyé depuis Childeric. Partage choisi par son auteur.');
  return lines.join('\n');
}
