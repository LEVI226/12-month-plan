/**
 * @vitest-environment node
 */

import { PiloteNode } from '../../src/donnees/pilote-node';
import { migrer } from '../../src/donnees/migrer';
import { DepotBilanSql } from '../../src/donnees/depot-bilan';
import { BilanNonGeleErreur, DepotPlanSql, PlanInvalideErreur } from '../../src/donnees/depot-plan';
import type { PiloteSql } from '../../src/donnees/pilote';

class PiloteErreurSurActions implements PiloteSql {
  constructor(private readonly pilote: PiloteSql) {}

  async executer(sql: string, params?: unknown[]): Promise<void> {
    if (sql.startsWith('INSERT INTO actions')) throw new Error('échec insertion action');
    await this.pilote.executer(sql, params);
  }

  lire<T>(sql: string, params?: unknown[]): Promise<T[]> {
    return this.pilote.lire<T>(sql, params);
  }
}

async function contexte(date = '2026-09-14') {
  const pilote = new PiloteNode();
  await migrer(pilote);
  const depotBilan = new DepotBilanSql(pilote, () => date);
  const bilan = await depotBilan.creerBrouillon();
  const depotPlan = new DepotPlanSql(pilote, () => date);
  return { pilote, depotBilan, depotPlan, bilan };
}

test('refuse de créer un plan depuis un bilan non gelé', async () => {
  const { depotPlan, bilan } = await contexte();
  await expect(depotPlan.creerDepuisBilanGele({
    bilanId: bilan.id,
    ambition: 'Tenir une direction claire',
    objectifs: [{ titre: 'Écrire', actions: [{ titre: 'Écrire 10 lignes', jours: [1, 3, 5] }] }],
  })).rejects.toThrow(BilanNonGeleErreur);
});

test('valide le volume minimal du plan', async () => {
  const { depotBilan, depotPlan, bilan } = await contexte();
  await depotBilan.geler(bilan.id);
  await expect(depotPlan.creerDepuisBilanGele({
    bilanId: bilan.id,
    ambition: '',
    objectifs: [],
  })).rejects.toThrow(PlanInvalideErreur);
});

test('crée un plan actif avec objectifs actions et occurrences sur 8 semaines', async () => {
  const { depotBilan, depotPlan, bilan } = await contexte();
  await depotBilan.geler(bilan.id);

  const plan = await depotPlan.creerDepuisBilanGele({
    bilanId: bilan.id,
    ambition: 'Tenir une direction claire',
    objectifs: [
      { titre: 'Écrire', actions: [{ titre: 'Écrire 10 lignes', jours: [1, 3, 5] }] },
      { titre: 'Bouger', actions: [{ titre: 'Marcher 30 minutes', jours: [2, 4] }] },
    ],
  });

  expect(plan.statut).toBe('actif');
  expect(plan.source).toBe('manuel');
  expect(plan.debutLe).toBe('2026-09-14');
  expect((await depotPlan.planActif())?.id).toBe(plan.id);

  const complet = await depotPlan.planComplet(plan.id);
  expect(complet.objectifs.map((o) => o.titre)).toEqual(['Écrire', 'Bouger']);
  expect(complet.actions.map((a) => a.titre)).toEqual(['Écrire 10 lignes', 'Marcher 30 minutes']);

  const occurrences = await depotPlan.occurrences(plan.id);
  expect(occurrences).toHaveLength(40);
  expect(occurrences[0]).toEqual(expect.objectContaining({
    titre: 'Écrire 10 lignes',
    datePrevue: '2026-09-14',
    statut: 'a_faire',
  }));
});

test('la génération est idempotente pour un plan relu', async () => {
  const { depotBilan, depotPlan, bilan } = await contexte();
  await depotBilan.geler(bilan.id);

  const plan = await depotPlan.creerDepuisBilanGele({
    bilanId: bilan.id,
    ambition: 'Tenir une direction claire',
    objectifs: [{ titre: 'Écrire', actions: [{ titre: 'Écrire 10 lignes', jours: [1, 3, 5] }] }],
  });

  await depotPlan.genererOccurrences(plan.id);
  await depotPlan.genererOccurrences(plan.id);

  expect(await depotPlan.occurrences(plan.id)).toHaveLength(24);
});

test('annule toute la création si une écriture dépendante échoue', async () => {
  const { pilote, depotBilan, depotPlan, bilan } = await contexte();
  await depotBilan.geler(bilan.id);
  const planInitial = await depotPlan.creerDepuisBilanGele({
    bilanId: bilan.id,
    ambition: 'Tenir une direction claire',
    objectifs: [{ titre: 'Écrire', actions: [{ titre: 'Écrire 10 lignes', jours: [1] }] }],
  });

  const autreBilan = await depotBilan.creerBrouillon();
  await depotBilan.geler(autreBilan.id);
  const depotEnErreur = new DepotPlanSql(new PiloteErreurSurActions(pilote), () => '2026-09-21');

  await expect(depotEnErreur.creerDepuisBilanGele({
    bilanId: autreBilan.id,
    ambition: 'Garder un plan cohérent',
    objectifs: [{ titre: 'Bouger', actions: [{ titre: 'Marcher 30 minutes', jours: [2] }] }],
  })).rejects.toThrow('échec insertion action');

  expect((await depotPlan.planActif())?.id).toBe(planInitial.id);
  const plans = await pilote.lire<{ statut: string; ambition: string }>('SELECT statut, ambition FROM plans ORDER BY rowid');
  expect(plans).toEqual([
    { statut: 'actif', ambition: 'Tenir une direction claire' },
  ]);
});
