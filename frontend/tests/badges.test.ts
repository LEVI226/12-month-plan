import { computeBadges } from '../src/lib/badges';
import { addDays, toKey } from '../src/lib/date';
import type { AppState } from '../src/store/AppStore';
const empty = (): AppState => ({ settings: null, bilan: { status: 'draft', answers: {} }, bilans: [], plan: null, occurrences: [], journal: {}, celebratedBadgeIds: [], hasComeback: false });
test.each([['first_step', 1], ['steps10', 10], ['steps30', 30]] as const)('%s unlocks at its action threshold', (id, threshold) => {
  const state = empty();
  const unlocked = () => computeBadges(state).find(b => b.id === id)?.unlocked;
  state.occurrences = Array.from({ length: threshold - 1 }, (_, index) => ({ id: String(index), status: 'done', actionId: 'a', objectiveId: 'o', actionTitle: '', objectiveTitle: '', date: '2026-09-13' }));
  expect(unlocked()).toBe(false);
  state.occurrences.push({ id: 'last', status: 'done', actionId: 'a', objectiveId: 'o', actionTitle: '', objectiveTitle: '', date: '2026-09-13' });
  expect(unlocked()).toBe(true);
});
test.each([['streak3', 3], ['streak7', 7], ['closed5', 5]] as const)('%s unlocks at its day threshold', (id, threshold) => {
  const state = empty();
  for (let i = 0; i < threshold - 1; i++) state.journal[toKey(addDays(new Date(), -i))] = { closed: true };
  expect(computeBadges(state).find(b => b.id === id)?.unlocked).toBe(false);
  state.journal[toKey(addDays(new Date(), -(threshold - 1)))] = { closed: true };
  expect(computeBadges(state).find(b => b.id === id)?.unlocked).toBe(true);
});
test('bilan, plan, cycle and comeback reflect their milestones', () => {
  const state = empty();
  expect(computeBadges(state).every(b => !b.unlocked)).toBe(true);
  state.bilans = [{ status: 'frozen', answers: {} }];
  state.hasComeback = true;
  state.plan = { ambition: 'Art', objectives: [], startKey: '2026-09-13', createdAt: '', cyclesCompleted: 1 };
  expect(computeBadges(state).filter(b => b.unlocked).map(b => b.id)).toEqual(['bilan', 'plan', 'cycle', 'comeback']);
});
