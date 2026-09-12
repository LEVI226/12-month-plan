import { ajouterJours, aujourdhuiLocal, datesSurSemaines, jourIso } from '../../src/domaine/dates';

test('formate une date civile locale sans conversion UTC visible', () => {
  expect(aujourdhuiLocal(new Date(2026, 8, 12, 23, 30))).toBe('2026-09-12');
});

test('ajoute des jours à une date civile', () => {
  expect(ajouterJours('2026-09-12', 1)).toBe('2026-09-13');
  expect(ajouterJours('2026-12-31', 1)).toBe('2027-01-01');
});

test('calcule le jour ISO de lundi à dimanche', () => {
  expect(jourIso('2026-09-14')).toBe(1);
  expect(jourIso('2026-09-20')).toBe(7);
});

test('produit toutes les dates d une fenêtre de semaines', () => {
  const dates = datesSurSemaines('2026-09-14', 2);
  expect(dates).toHaveLength(14);
  expect(dates[0]).toBe('2026-09-14');
  expect(dates[13]).toBe('2026-09-27');
});
