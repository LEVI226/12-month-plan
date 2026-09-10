/**
 * @vitest-environment node
 */

import { PiloteNode } from '../../src/donnees/pilote-node';
import { migrer } from '../../src/donnees/migrer';

async function baseNeuve() {
  const pilote = new PiloteNode();
  await migrer(pilote);
  return pilote;
}

test('crée toutes les tables du schéma v1', async () => {
  const pilote = await baseNeuve();
  const tables = await pilote.lire<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type='table'",
  );
  const noms = tables.map((t) => t.name);
  for (const attendue of [
    'parametres', 'bilans', 'reponses', 'plans', 'objectifs',
    'jalons', 'actions', 'occurrences', 'journal_jours',
    'notifications', 'generations_ia',
  ]) {
    expect(noms).toContain(attendue);
  }
});

test('migrer deux fois ne casse rien et reste à la même version', async () => {
  const pilote = await baseNeuve();
  const version = await migrer(pilote);
  expect(version).toBe(1);
});

test('une réponse ne peut pas être enregistrée deux fois pour la même question', async () => {
  const pilote = await baseNeuve();
  await pilote.executer("INSERT INTO bilans (id, statut, version_catalogue, cree_le) VALUES ('b1', 'brouillon', 1, '2026-09-10')");
  await pilote.executer("INSERT INTO reponses (bilan_id, question_code, valeur, maj_le) VALUES ('b1', 'p1_identite', 'x', '2026-09-10')");
  await expect(
    pilote.executer("INSERT INTO reponses (bilan_id, question_code, valeur, maj_le) VALUES ('b1', 'p1_identite', 'y', '2026-09-10')"),
  ).rejects.toThrow();
});
