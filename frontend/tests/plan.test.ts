import { generateOccurrences } from '../src/lib/plan';
import { fromKey, startOfWeek, toKey, daysBetween } from '../src/lib/date';
import { suggestPlan } from '../src/lib/suggest';
test('eight weeks of Monday actions have unique identities', () => {
  const result = generateOccurrences({ ambition: 'Lire', startKey: '2026-09-14', createdAt: '', objectives: [{ id: 'o', title: 'Lire', actions: [{ id: 'a', title: '10 pages', days: [0] }] }] });
  expect(result).toHaveLength(8);
  expect(new Set(result.map(o => o.id)).size).toBe(8);
  expect(result.every(o => fromKey(o.date).getDay() === 1)).toBe(true);
});
test('civil dates and Monday week start', () => {
  expect(toKey(new Date(2026, 2, 29, 23, 30))).toBe('2026-03-29');
  expect(toKey(new Date(2026, 2, 29, 0, 30))).toBe('2026-03-29');
  expect(startOfWeek(new Date(2026, 2, 29)).getDay()).toBe(1);
  expect(daysBetween('2026-03-28', '2026-03-30')).toBe(2);
});
test('rich answers replace generic actions', () => {
  const result = suggestPlan({ p_loisirs: 'Peinture', pro_projet: 'Mon portfolio' });
  expect(JSON.stringify(result)).not.toMatch(/Marcher|gratitude|candidature/);
  expect(JSON.stringify(result)).toContain('Peinture');
});
test('empty bilan has a local fallback', () => expect(suggestPlan({}).objectives.length).toBeGreaterThan(0));
