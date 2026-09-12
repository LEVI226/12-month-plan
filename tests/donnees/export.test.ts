/**
 * @vitest-environment node
 */

import { PiloteNode } from '../../src/donnees/pilote-node';
import { migrer } from '../../src/donnees/migrer';
import { DepotBilanSql } from '../../src/donnees/depot-bilan';
import { DepotPlanSql } from '../../src/donnees/depot-plan';
import { DepotSuiviSql } from '../../src/donnees/depot-suivi';
import { exporterResumeRoutine, exporterTout, supprimerTout } from '../../src/donnees/export';

async function contexte() {
  const pilote = new PiloteNode();
  await migrer(pilote);
  const depot = new DepotBilanSql(pilote, () => '2026-09-10');
  const bilan = await depot.creerBrouillon();
  await depot.repondre(bilan.id, 'p_aime', 'la moto');
  return { pilote, bilan };
}

test("l'export contient la version, la date et les réponses", async () => {
  const { pilote } = await contexte();
  const contenu = JSON.parse(await exporterTout(pilote));
  expect(contenu.versionSchema).toBe(1);
  expect(contenu.exporteLe).toMatch(/^\d{4}-\d{2}-\d{2}/);
  expect(contenu.tables.reponses).toContainEqual(
    expect.objectContaining({ question_code: 'p_aime', valeur: 'la moto' }),
  );
});

test('la suppression vide toutes les tables mais garde le schéma', async () => {
  const { pilote } = await contexte();
  await supprimerTout(pilote);
  const contenu = JSON.parse(await exporterTout(pilote));
  expect(contenu.tables.bilans).toEqual([]);
  expect(contenu.tables.reponses).toEqual([]);
  expect(contenu.versionSchema).toBe(1);
});

test('exporte un résumé textuel de la routine', async () => {
  const { pilote, bilan } = await contexte();
  const depotBilan = new DepotBilanSql(pilote, () => '2026-09-14');
  await depotBilan.geler(bilan.id);
  const depotPlan = new DepotPlanSql(pilote, () => '2026-09-14');
  await depotPlan.creerDepuisBilanGele({
    bilanId: bilan.id,
    ambition: 'Tenir une direction claire',
    objectifs: [{ titre: 'Écrire', actions: [{ titre: 'Écrire 10 lignes', jours: [1] }] }],
  });
  const depotSuivi = new DepotSuiviSql(pilote, () => '2026-09-14');
  await depotSuivi.cloturerJournee('2026-09-14', 4, 'Bonne reprise');

  const resume = await exporterResumeRoutine(pilote);
  expect(resume).toContain('Ambition : Tenir une direction claire');
  expect(resume).toContain('Objectif : Écrire');
  expect(resume).toContain('Action : Écrire 10 lignes');
  expect(resume).toContain('Jours clôturés : 1');
  expect(resume).toContain('Note : Bonne reprise');
});
