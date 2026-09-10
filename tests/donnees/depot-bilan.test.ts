/**
 * @vitest-environment node
 */

import { PiloteNode } from '../../src/donnees/pilote-node';
import { migrer } from '../../src/donnees/migrer';
import { DepotBilanSql, BilanGeleErreur } from '../../src/donnees/depot-bilan';
import { QUESTIONS } from '../../src/domaine/questions';

async function depotNeuf() {
  const pilote = new PiloteNode();
  await migrer(pilote);
  return new DepotBilanSql(pilote, () => '2026-09-10');
}

test('crée un brouillon et le retrouve comme bilan courant', async () => {
  const depot = await depotNeuf();
  const cree = await depot.creerBrouillon();
  expect(cree.statut).toBe('brouillon');
  expect((await depot.bilanCourant())?.id).toBe(cree.id);
});

test('enregistre une réponse et la relit', async () => {
  const depot = await depotNeuf();
  const bilan = await depot.creerBrouillon();
  await depot.repondre(bilan.id, 'p_aime', 'la moto');
  expect(await depot.reponses(bilan.id)).toEqual({ p_aime: 'la moto' });
});

test('réécrire une réponse la remplace au lieu de la dupliquer', async () => {
  const depot = await depotNeuf();
  const bilan = await depot.creerBrouillon();
  await depot.repondre(bilan.id, 'p_aime', 'la moto');
  await depot.repondre(bilan.id, 'p_aime', 'la moto et le code');
  expect(await depot.reponses(bilan.id)).toEqual({ p_aime: 'la moto et le code' });
});

test('la progression compte les réponses non vides sur le total du catalogue', async () => {
  const depot = await depotNeuf();
  const bilan = await depot.creerBrouillon();
  await depot.repondre(bilan.id, 'p_aime', 'la moto');
  expect(await depot.progression(bilan.id)).toEqual({ repondues: 1, total: QUESTIONS.length });
});

test('une réponse vide efface la réponse au lieu de la stocker', async () => {
  const depot = await depotNeuf();
  const bilan = await depot.creerBrouillon();
  await depot.repondre(bilan.id, 'p_aime', 'la moto');
  await depot.repondre(bilan.id, 'p_aime', '   ');
  expect(await depot.reponses(bilan.id)).toEqual({});
});

test('geler date le bilan et change son statut', async () => {
  const depot = await depotNeuf();
  const bilan = await depot.creerBrouillon();
  const gele = await depot.geler(bilan.id);
  expect(gele.statut).toBe('gele');
  expect(gele.geleLe).toBe('2026-09-10');
});

test('un bilan gelé refuse toute écriture', async () => {
  const depot = await depotNeuf();
  const bilan = await depot.creerBrouillon();
  await depot.geler(bilan.id);
  await expect(depot.repondre(bilan.id, 'p_aime', 'autre chose')).rejects.toThrow(BilanGeleErreur);
});

test('geler deux fois échoue', async () => {
  const depot = await depotNeuf();
  const bilan = await depot.creerBrouillon();
  await depot.geler(bilan.id);
  await expect(depot.geler(bilan.id)).rejects.toThrow(BilanGeleErreur);
});
