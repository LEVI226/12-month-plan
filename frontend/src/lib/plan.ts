import { addDays, fromKey, toKey, weekdayMon0 } from '@/src/lib/date';

export type OccurrenceStatus = 'pending' | 'done' | 'missed';

export interface PlanAction {
  id: string;
  title: string;
  days: number[]; // Monday=0 ... Sunday=6
}

export interface PlanObjective {
  id: string;
  title: string;
  actions: PlanAction[];
}

export interface Plan {
  ambition: string;
  objectives: PlanObjective[];
  createdAt: string;
  startKey: string;
}

export interface Occurrence {
  id: string;
  actionId: string;
  objectiveId: string;
  actionTitle: string;
  objectiveTitle: string;
  date: string; // YYYY-MM-DD
  status: OccurrenceStatus;
}

export const PLAN_WEEKS = 8;

export function generateOccurrences(plan: Plan): Occurrence[] {
  const start = fromKey(plan.startKey);
  const occ: Occurrence[] = [];
  for (const obj of plan.objectives) {
    for (const act of obj.actions) {
      if (!act.days.length) continue;
      for (let i = 0; i < PLAN_WEEKS * 7; i++) {
        const d = addDays(start, i);
        if (act.days.includes(weekdayMon0(d))) {
          const dateKey = toKey(d);
          occ.push({
            id: `${act.id}__${dateKey}`,
            actionId: act.id,
            objectiveId: obj.id,
            actionTitle: act.title,
            objectiveTitle: obj.title,
            date: dateKey,
            status: 'pending',
          });
        }
      }
    }
  }
  return occ;
}
