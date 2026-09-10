/**
 * @vitest-environment node
 */

import { PiloteNode } from '../../src/donnees/pilote-node';
import { migrer } from '../../src/donnees/migrer';
import { DepotBilanSql } from '../../src/donnees/depot-bilan';
import { exporterTout, supprimerTout } from '../../src/donnees/export';

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
