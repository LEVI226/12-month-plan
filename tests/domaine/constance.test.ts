import type { JournalJour, Occurrence } from '../../src/domaine/types';
import { calculerSerie, calculerStatistiques } from '../../src/domaine/constance';

function journal(date: string, humeur: number | null = 4): JournalJour {
  return { date, humeur, note: '', clotureLe: date };
}

function occurrence(statut: Occurrence['statut']): Occurrence {
  return { id: crypto.randomUUID(), actionId: 'a1', titre: 'Action', datePrevue: '2026-09-14', statut, faitLe: null, note: null };
}

test('calcule la série de jours clôturés jusqu à aujourd hui', () => {
  expect(calculerSerie([
    journal('2026-09-12'),
    journal('2026-09-13'),
    journal('2026-09-14'),
  ], '2026-09-14')).toBe(3);
});

test('la série s arrête au premier jour manquant', () => {
  expect(calculerSerie([
    journal('2026-09-12'),
    journal('2026-09-14'),
  ], '2026-09-14')).toBe(1);
});

test('calcule les statistiques de constance', () => {
  const stats = calculerStatistiques(
    [journal('2026-09-13', 3), journal('2026-09-14', 5)],
    [occurrence('fait'), occurrence('fait'), occurrence('manque'), occurrence('a_faire')],
    '2026-09-14',
  );
  expect(stats).toEqual({
    joursClotures: 2,
    actionsFaites: 2,
    actionsManquees: 1,
    humeurMoyenne: 4,
    serie: 2,
  });
});
