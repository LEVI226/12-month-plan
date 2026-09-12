/**
 * @vitest-environment node
 */

import { PiloteNode } from '../../src/donnees/pilote-node';
import { migrer } from '../../src/donnees/migrer';
import { DepotBilanSql } from '../../src/donnees/depot-bilan';
import { DepotPlanSql } from '../../src/donnees/depot-plan';
import { DepotSuiviSql } from '../../src/donnees/depot-suivi';

async function contexte() {
  const pilote = new PiloteNode();
  await migrer(pilote);
  const depotBilan = new DepotBilanSql(pilote, () => '2026-09-14');
  const bilan = await depotBilan.creerBrouillon();
  await depotBilan.geler(bilan.id);
  const depotPlan = new DepotPlanSql(pilote, () => '2026-09-14');
  const plan = await depotPlan.creerDepuisBilanGele({
    bilanId: bilan.id,
    ambition: 'Tenir une direction claire',
    objectifs: [{ titre: 'Écrire', actions: [{ titre: 'Écrire 10 lignes', jours: [1] }] }],
  });
  const depotSuivi = new DepotSuiviSql(pilote, () => '2026-09-14');
  return { depotPlan, depotSuivi, plan };
}

test('lit les actions prévues pour une journée', async () => {
  const { depotSuivi } = await contexte();
  const journee = await depotSuivi.journee('2026-09-14');
  expect(journee.occurrences).toHaveLength(1);
  expect(journee.occurrences[0].titre).toBe('Écrire 10 lignes');
  expect(journee.cloturee).toBe(false);
});

test('coche et décoche une occurrence', async () => {
  const { depotSuivi } = await contexte();
  const [occurrence] = (await depotSuivi.journee('2026-09-14')).occurrences;
  await depotSuivi.cocherOccurrence(occurrence.id, true);
  expect((await depotSuivi.journee('2026-09-14')).occurrences[0].statut).toBe('fait');
  await depotSuivi.cocherOccurrence(occurrence.id, false);
  expect((await depotSuivi.journee('2026-09-14')).occurrences[0].statut).toBe('a_faire');
});

test('clôture une journée et marque les actions restantes comme manquées', async () => {
  const { depotSuivi } = await contexte();
  await depotSuivi.cloturerJournee('2026-09-14', 4, 'Bonne reprise');
  const journee = await depotSuivi.journee('2026-09-14');
  expect(journee.cloturee).toBe(true);
  expect(journee.journal).toEqual(expect.objectContaining({
    date: '2026-09-14',
    humeur: 4,
    note: 'Bonne reprise',
    clotureLe: '2026-09-14',
  }));
  expect(journee.occurrences[0].statut).toBe('manque');
});

test('lit les journaux clôturés pour le suivi', async () => {
  const { depotSuivi } = await contexte();
  await depotSuivi.cloturerJournee('2026-09-14', 4, 'Bonne reprise');
  expect(await depotSuivi.journaux()).toEqual([
    { date: '2026-09-14', humeur: 4, note: 'Bonne reprise', clotureLe: '2026-09-14' },
  ]);
});
