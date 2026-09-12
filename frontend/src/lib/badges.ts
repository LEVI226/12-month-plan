import type { AppState } from '@/src/store/AppStore';
import type { IconName } from '@/src/components/Icon';

export interface Badge {
  id: string;
  icon: IconName;
  title: string;
  description: string;
  unlocked: boolean;
}

export function computeBadges(state: AppState): Badge[] {
  const closedDays = Object.values(state.journal).filter((d) => d.closed).length;
  const doneTotal = state.occurrences.filter((o) => o.status === 'done').length;
  const streak = computeStreak(state);
  const cyclesCompleted = state.plan?.cyclesCompleted ?? 0;

  const defs: Omit<Badge, 'unlocked'>[] = [
    { id: 'bilan', icon: 'book', title: 'Bilan accompli', description: 'Vous avez terminé votre bilan complet.' },
    { id: 'plan', icon: 'target', title: 'Cap fixé', description: 'Votre premier plan est créé.' },
    { id: 'first_step', icon: 'leaf', title: 'Premier pas', description: 'Vous avez coché votre première action.' },
    { id: 'steps10', icon: 'sparkle', title: '10 petits pas', description: '10 actions accomplies au total.' },
    { id: 'steps30', icon: 'sparkle', title: '30 petits pas', description: '30 actions accomplies au total.' },
    { id: 'streak3', icon: 'flame', title: '3 jours d\u2019affilée', description: 'Trois journées clôturées de suite.' },
    { id: 'streak7', icon: 'flame', title: 'Une semaine de constance', description: 'Sept journées clôturées de suite.' },
    { id: 'closed5', icon: 'calendar', title: '5 journées clôturées', description: 'Vous avez clôturé 5 journées.' },
    { id: 'cycle', icon: 'rotate', title: 'Nouveau cycle', description: 'Vous avez relancé ou ajusté un cycle de 8 semaines.' },
    { id: 'comeback', icon: 'sun', title: 'Retour en douceur', description: 'Vous êtes revenu(e) après une pause, sans vous juger.' },
  ];

  const unlockedMap: Record<string, boolean> = {
    bilan: state.bilan.status === 'frozen',
    plan: !!state.plan,
    first_step: doneTotal >= 1,
    steps10: doneTotal >= 10,
    steps30: doneTotal >= 30,
    streak3: streak >= 3,
    streak7: streak >= 7,
    closed5: closedDays >= 5,
    cycle: cyclesCompleted >= 1,
    comeback: !!state.hasComeback,
  };

  return defs.map((d) => ({ ...d, unlocked: !!unlockedMap[d.id] }));
}

function computeStreak(state: AppState): number {
  // Mirrors the streak logic used in the Suivi screen.
  let count = 0;
  let d = new Date();
  const toKey = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };
  const step = (date: Date) => {
    const x = new Date(date);
    x.setDate(x.getDate() - 1);
    return x;
  };
  if (!state.journal[toKey(d)]?.closed) d = step(d);
  while (state.journal[toKey(d)]?.closed) {
    count += 1;
    d = step(d);
  }
  return count;
}

export interface Level {
  name: string;
  min: number;
  next: number | null;
}

const LEVELS: { name: string; min: number }[] = [
  { name: 'Graine', min: 0 },
  { name: 'Pousse', min: 5 },
  { name: 'Bourgeon', min: 15 },
  { name: 'Feuillage', min: 30 },
  { name: 'Arbre', min: 60 },
  { name: 'Racines profondes', min: 100 },
];

export function getLevel(points: number): Level {
  let current = LEVELS[0];
  for (let i = 0; i < LEVELS.length; i++) {
    if (points >= LEVELS[i].min) current = LEVELS[i];
  }
  const idx = LEVELS.indexOf(current);
  const next = idx + 1 < LEVELS.length ? LEVELS[idx + 1].min : null;
  return { name: current.name, min: current.min, next };
}
