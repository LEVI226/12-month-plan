# Childeric Routine Offline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construire la boucle offline bilan gelé -> plan d'action -> écran du jour -> humeur/note/clôture -> suivi de constance sur 8 semaines.

**Architecture:** Conserver l'architecture actuelle React + dépôts SQL. Les tables `plans`, `objectifs`, `actions`, `occurrences` et `journal_jours` existent déjà ; cette tranche ajoute les dépôts et écrans qui les utilisent, sans serveur et sans nouvelle migration.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, Testing Library, SQLite via `PiloteSql`, Capacitor Android.

**Spec:** `docs/superpowers/specs/2026-09-12-childeric-routine-offline-design.md`

## Global Constraints

- Français partout : noms de modules, types métier, fonctions, variables et textes d'interface restent en français.
- Aucun accès SQL hors de `src/donnees/`.
- Les dates sont civiles et locales, au format `AAAA-MM-JJ`, jamais des horodatages UTC convertis à l'affichage.
- Le plan et le suivi sont 100% offline.
- Un seul plan actif à la fois.
- Un plan ne peut être créé qu'à partir d'un bilan gelé.
- L'écran du jour affiche au maximum 6 actions.
- La journée peut être clôturée même si toutes les actions ne sont pas faites ; les restantes passent à `manque`.
- La série de constance se calcule depuis `journal_jours` et ne se stocke pas.
- TDD strict : écrire le test, le voir échouer, puis implémenter.

---

## File Structure

| Fichier | Responsabilité |
|---|---|
| `src/domaine/types.ts` | Ajouter les types `Plan`, `Objectif`, `ActionPlan`, `Occurrence`, `JournalJour`, `StatutOccurrence`, `SaisiePlan` |
| `src/domaine/dates.ts` | Fonctions pures pour dates locales, ajout de jours, jour ISO, fenêtre de 8 semaines |
| `src/domaine/constance.ts` | Calcul de série et statistiques 8 semaines à partir du journal et des occurrences |
| `src/donnees/depot-plan.ts` | Créer un plan manuel, vérifier le bilan gelé, générer les occurrences, lire le plan actif |
| `src/donnees/depot-suivi.ts` | Lire la journée, cocher une occurrence, enregistrer humeur/note, clôturer la journée |
| `src/ui/ecrans/Plan.tsx` | Formulaire guidé de plan manuel après bilan gelé |
| `src/ui/ecrans/Jour.tsx` | Écran quotidien : actions, humeur, note, clôture |
| `src/ui/ecrans/Suivi.tsx` | Vue simple de constance |
| `src/ui/App.tsx` | Aiguillage vers plan, jour, suivi et réglages |
| `src/donnees/export.ts` | Ajouter un résumé textuel partageable en plus de l'export JSON existant |

---

### Task 1: Types métier et dates civiles

**Files:**
- Modify: `src/domaine/types.ts`
- Create: `src/domaine/dates.ts`
- Test: `tests/domaine/dates.test.ts`

**Interfaces:**
- Consumes: existing `Bilan`
- Produces:
  - `type StatutPlan = 'brouillon' | 'actif' | 'archive'`
  - `type StatutOccurrence = 'a_faire' | 'fait' | 'manque' | 'reporte'`
  - `interface Plan`
  - `interface Objectif`
  - `interface ActionPlan`
  - `interface Occurrence`
  - `interface JournalJour`
  - `interface SaisiePlan`
  - `aujourdhuiLocal(date?: Date): string`
  - `ajouterJours(date: string, jours: number): string`
  - `jourIso(date: string): number`
  - `datesSurSemaines(debut: string, semaines: number): string[]`

- [ ] **Step 1: Write the failing test**

`tests/domaine/dates.test.ts`:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
node node_modules/vitest/vitest.mjs run tests/domaine/dates.test.ts
```

Expected: FAIL because `src/domaine/dates.ts` does not exist.

- [ ] **Step 3: Add domain types**

Append to `src/domaine/types.ts`:

```ts
export type StatutPlan = 'brouillon' | 'actif' | 'archive';
export type TypeAction = 'ponctuelle' | 'recurrente';
export type StatutOccurrence = 'a_faire' | 'fait' | 'manque' | 'reporte';

export interface Plan {
  id: string;
  bilanId: string;
  ambition: string;
  statut: StatutPlan;
  debutLe: string | null;
  finLe: string | null;
  source: 'ia' | 'manuel';
  version: number;
}

export interface Objectif {
  id: string;
  planId: string;
  titre: string;
  description: string;
  trimestre: number;
  ordre: number;
}

export interface ActionPlan {
  id: string;
  planId: string;
  jalonId: string | null;
  titre: string;
  type: TypeAction;
  semaine: number | null;
  recurrence: string | null;
  ordre: number;
}

export interface Occurrence {
  id: string;
  actionId: string;
  titre: string;
  datePrevue: string;
  statut: StatutOccurrence;
  faitLe: string | null;
  note: string | null;
}

export interface JournalJour {
  date: string;
  humeur: number | null;
  note: string | null;
  clotureLe: string | null;
}

export interface SaisieAction {
  titre: string;
  jours: number[];
}

export interface SaisieObjectif {
  titre: string;
  actions: SaisieAction[];
}

export interface SaisiePlan {
  bilanId: string;
  ambition: string;
  objectifs: SaisieObjectif[];
}
```

- [ ] **Step 4: Implement date helpers**

Create `src/domaine/dates.ts`:

```ts
function deuxChiffres(valeur: number): string {
  return String(valeur).padStart(2, '0');
}

function depuisDateCivile(date: string): Date {
  const [annee, mois, jour] = date.split('-').map(Number);
  return new Date(annee, mois - 1, jour);
}

export function aujourdhuiLocal(date = new Date()): string {
  return `${date.getFullYear()}-${deuxChiffres(date.getMonth() + 1)}-${deuxChiffres(date.getDate())}`;
}

export function ajouterJours(date: string, jours: number): string {
  const copie = depuisDateCivile(date);
  copie.setDate(copie.getDate() + jours);
  return aujourdhuiLocal(copie);
}

export function jourIso(date: string): number {
  const jour = depuisDateCivile(date).getDay();
  return jour === 0 ? 7 : jour;
}

export function datesSurSemaines(debut: string, semaines: number): string[] {
  return Array.from({ length: semaines * 7 }, (_, index) => ajouterJours(debut, index));
}
```

- [ ] **Step 5: Run test to verify it passes**

Run:

```bash
node node_modules/vitest/vitest.mjs run tests/domaine/dates.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/domaine/types.ts src/domaine/dates.ts tests/domaine/dates.test.ts
git commit -m "feat(domaine): dates civiles pour routine offline"
```

---

### Task 2: Dépôt du plan manuel et génération des occurrences

**Files:**
- Create: `src/donnees/depot-plan.ts`
- Test: `tests/donnees/depot-plan.test.ts`

**Interfaces:**
- Consumes:
  - `PiloteSql`
  - `SaisiePlan`
  - `Plan`
  - `Objectif`
  - `ActionPlan`
  - `Occurrence`
  - `datesSurSemaines(debut, semaines)`
  - `jourIso(date)`
- Produces:
  - `class BilanNonGeleErreur extends Error`
  - `class PlanInvalideErreur extends Error`
  - `interface PlanComplet { plan: Plan; objectifs: Objectif[]; actions: ActionPlan[] }`
  - `class DepotPlanSql`
  - `DepotPlanSql.creerDepuisBilanGele(saisie: SaisiePlan): Promise<Plan>`
  - `DepotPlanSql.planActif(): Promise<Plan | null>`
  - `DepotPlanSql.planComplet(planId: string): Promise<PlanComplet>`
  - `DepotPlanSql.genererOccurrences(planId: string): Promise<void>`
  - `DepotPlanSql.occurrences(planId: string): Promise<Occurrence[]>`

- [ ] **Step 1: Write the failing test**

`tests/donnees/depot-plan.test.ts`:

```ts
/**
 * @vitest-environment node
 */

import { PiloteNode } from '../../src/donnees/pilote-node';
import { migrer } from '../../src/donnees/migrer';
import { DepotBilanSql } from '../../src/donnees/depot-bilan';
import { BilanNonGeleErreur, DepotPlanSql, PlanInvalideErreur } from '../../src/donnees/depot-plan';

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
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
node node_modules/vitest/vitest.mjs run tests/donnees/depot-plan.test.ts
```

Expected: FAIL because `src/donnees/depot-plan.ts` does not exist.

- [ ] **Step 3: Implement repository**

Create `src/donnees/depot-plan.ts`:

```ts
import { ajouterJours, datesSurSemaines, jourIso } from '../domaine/dates';
import type { ActionPlan, Objectif, Occurrence, Plan, SaisiePlan } from '../domaine/types';
import type { PiloteSql } from './pilote';

export class BilanNonGeleErreur extends Error {
  constructor() {
    super('Le plan ne peut être créé qu après un bilan gelé.');
    this.name = 'BilanNonGeleErreur';
  }
}

export class PlanInvalideErreur extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PlanInvalideErreur';
  }
}

export interface PlanComplet {
  plan: Plan;
  objectifs: Objectif[];
  actions: ActionPlan[];
}

interface LignePlan {
  id: string;
  bilan_id: string;
  ambition: string;
  statut: Plan['statut'];
  debut_le: string | null;
  fin_le: string | null;
  source: Plan['source'];
  version: number;
}

interface LigneObjectif {
  id: string;
  plan_id: string;
  titre: string;
  description: string;
  trimestre: number;
  ordre: number;
}

interface LigneAction {
  id: string;
  plan_id: string;
  jalon_id: string | null;
  titre: string;
  type: ActionPlan['type'];
  semaine: number | null;
  recurrence: string | null;
  ordre: number;
}

interface LigneOccurrence {
  id: string;
  action_id: string;
  titre: string;
  date_prevue: string;
  statut: Occurrence['statut'];
  fait_le: string | null;
  note: string | null;
}

function uuid(): string {
  return crypto.randomUUID();
}

function versPlan(ligne: LignePlan): Plan {
  return {
    id: ligne.id,
    bilanId: ligne.bilan_id,
    ambition: ligne.ambition,
    statut: ligne.statut,
    debutLe: ligne.debut_le,
    finLe: ligne.fin_le,
    source: ligne.source,
    version: ligne.version,
  };
}

function versObjectif(ligne: LigneObjectif): Objectif {
  return {
    id: ligne.id,
    planId: ligne.plan_id,
    titre: ligne.titre,
    description: ligne.description,
    trimestre: ligne.trimestre,
    ordre: ligne.ordre,
  };
}

function versAction(ligne: LigneAction): ActionPlan {
  return {
    id: ligne.id,
    planId: ligne.plan_id,
    jalonId: ligne.jalon_id,
    titre: ligne.titre,
    type: ligne.type,
    semaine: ligne.semaine,
    recurrence: ligne.recurrence,
    ordre: ligne.ordre,
  };
}

function versOccurrence(ligne: LigneOccurrence): Occurrence {
  return {
    id: ligne.id,
    actionId: ligne.action_id,
    titre: ligne.titre,
    datePrevue: ligne.date_prevue,
    statut: ligne.statut,
    faitLe: ligne.fait_le,
    note: ligne.note,
  };
}

function validerSaisie(saisie: SaisiePlan): void {
  if (saisie.ambition.trim() === '') throw new PlanInvalideErreur('L ambition est obligatoire.');
  if (saisie.objectifs.length < 1 || saisie.objectifs.length > 3) {
    throw new PlanInvalideErreur('Le plan doit contenir entre 1 et 3 objectifs.');
  }
  for (const objectif of saisie.objectifs) {
    if (objectif.titre.trim() === '') throw new PlanInvalideErreur('Chaque objectif doit avoir un titre.');
    if (objectif.actions.length === 0) throw new PlanInvalideErreur('Chaque objectif doit contenir au moins une action.');
    for (const action of objectif.actions) {
      if (action.titre.trim() === '') throw new PlanInvalideErreur('Chaque action doit avoir un titre.');
      if (action.jours.length === 0 || action.jours.some((jour) => jour < 1 || jour > 7)) {
        throw new PlanInvalideErreur('Chaque action doit avoir des jours ISO entre 1 et 7.');
      }
    }
  }
}

export class DepotPlanSql {
  constructor(
    private readonly pilote: PiloteSql,
    private readonly maintenant: () => string,
  ) {}

  async creerDepuisBilanGele(saisie: SaisiePlan): Promise<Plan> {
    validerSaisie(saisie);
    const bilans = await this.pilote.lire<{ statut: string }>('SELECT statut FROM bilans WHERE id = ?', [saisie.bilanId]);
    if (bilans[0]?.statut !== 'gele') throw new BilanNonGeleErreur();

    await this.pilote.executer("UPDATE plans SET statut = 'archive' WHERE statut = 'actif'");

    const debut = this.maintenant();
    const fin = ajouterJours(debut, 364);
    const planId = uuid();
    await this.pilote.executer(
      'INSERT INTO plans (id, bilan_id, ambition, statut, debut_le, fin_le, source, version) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [planId, saisie.bilanId, saisie.ambition.trim(), 'actif', debut, fin, 'manuel', 1],
    );

    let ordreAction = 1;
    for (const [indexObjectif, objectif] of saisie.objectifs.entries()) {
      const objectifId = uuid();
      await this.pilote.executer(
        'INSERT INTO objectifs (id, plan_id, titre, description, trimestre, ordre) VALUES (?, ?, ?, ?, ?, ?)',
        [objectifId, planId, objectif.titre.trim(), '', 1, indexObjectif + 1],
      );
      for (const action of objectif.actions) {
        await this.pilote.executer(
          'INSERT INTO actions (id, plan_id, jalon_id, titre, type, semaine, recurrence, ordre) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [uuid(), planId, null, action.titre.trim(), 'recurrente', null, JSON.stringify({ jours: action.jours, pendantSemaines: 8 }), ordreAction],
        );
        ordreAction += 1;
      }
    }

    await this.genererOccurrences(planId);
    const actif = await this.planActif();
    if (!actif) throw new Error('Plan actif introuvable après création.');
    return actif;
  }

  async planActif(): Promise<Plan | null> {
    const lignes = await this.pilote.lire<LignePlan>("SELECT * FROM plans WHERE statut = 'actif' ORDER BY rowid DESC LIMIT 1");
    return lignes.length ? versPlan(lignes[0]) : null;
  }

  async planComplet(planId: string): Promise<PlanComplet> {
    const [plan] = await this.pilote.lire<LignePlan>('SELECT * FROM plans WHERE id = ?', [planId]);
    if (!plan) throw new Error(`Plan introuvable : ${planId}`);
    const objectifs = await this.pilote.lire<LigneObjectif>('SELECT * FROM objectifs WHERE plan_id = ? ORDER BY ordre', [planId]);
    const actions = await this.pilote.lire<LigneAction>('SELECT * FROM actions WHERE plan_id = ? ORDER BY ordre', [planId]);
    return { plan: versPlan(plan), objectifs: objectifs.map(versObjectif), actions: actions.map(versAction) };
  }

  async genererOccurrences(planId: string): Promise<void> {
    const complet = await this.planComplet(planId);
    if (!complet.plan.debutLe) throw new Error('Le plan actif doit avoir une date de début.');
    const dates = datesSurSemaines(complet.plan.debutLe, 8);
    for (const action of complet.actions) {
      const recurrence = action.recurrence ? JSON.parse(action.recurrence) as { jours: number[] } : { jours: [] };
      for (const date of dates.filter((candidate) => recurrence.jours.includes(jourIso(candidate)))) {
        await this.pilote.executer(
          `INSERT OR IGNORE INTO occurrences (id, action_id, date_prevue, statut, fait_le, note)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [uuid(), action.id, date, 'a_faire', null, null],
        );
      }
    }
  }

  async occurrences(planId: string): Promise<Occurrence[]> {
    const lignes = await this.pilote.lire<LigneOccurrence>(
      `SELECT occurrences.*, actions.titre
       FROM occurrences
       INNER JOIN actions ON actions.id = occurrences.action_id
       WHERE actions.plan_id = ?
       ORDER BY occurrences.date_prevue, actions.ordre`,
      [planId],
    );
    return lignes.map(versOccurrence);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
node node_modules/vitest/vitest.mjs run tests/donnees/depot-plan.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/donnees/depot-plan.ts tests/donnees/depot-plan.test.ts
git commit -m "feat(donnees): plan manuel et occurrences huit semaines"
```

---

### Task 3: Dépôt du suivi quotidien

**Files:**
- Create: `src/donnees/depot-suivi.ts`
- Test: `tests/donnees/depot-suivi.test.ts`

**Interfaces:**
- Consumes:
  - `PiloteSql`
  - `Occurrence`
  - `JournalJour`
- Produces:
  - `interface Journee { date: string; occurrences: Occurrence[]; journal: JournalJour | null; cloturee: boolean }`
  - `class DepotSuiviSql`
  - `DepotSuiviSql.journee(date: string): Promise<Journee>`
  - `DepotSuiviSql.cocherOccurrence(occurrenceId: string, faite: boolean): Promise<void>`
  - `DepotSuiviSql.enregistrerJournal(date: string, humeur: number | null, note: string): Promise<void>`
  - `DepotSuiviSql.cloturerJournee(date: string, humeur: number | null, note: string): Promise<void>`

- [ ] **Step 1: Write the failing test**

`tests/donnees/depot-suivi.test.ts`:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
node node_modules/vitest/vitest.mjs run tests/donnees/depot-suivi.test.ts
```

Expected: FAIL because `src/donnees/depot-suivi.ts` does not exist.

- [ ] **Step 3: Implement repository**

Create `src/donnees/depot-suivi.ts`:

```ts
import type { JournalJour, Occurrence } from '../domaine/types';
import type { PiloteSql } from './pilote';

export interface Journee {
  date: string;
  occurrences: Occurrence[];
  journal: JournalJour | null;
  cloturee: boolean;
}

interface LigneOccurrence {
  id: string;
  action_id: string;
  titre: string;
  date_prevue: string;
  statut: Occurrence['statut'];
  fait_le: string | null;
  note: string | null;
}

interface LigneJournal {
  date: string;
  humeur: number | null;
  note: string | null;
  cloture_le: string | null;
}

function versOccurrence(ligne: LigneOccurrence): Occurrence {
  return {
    id: ligne.id,
    actionId: ligne.action_id,
    titre: ligne.titre,
    datePrevue: ligne.date_prevue,
    statut: ligne.statut,
    faitLe: ligne.fait_le,
    note: ligne.note,
  };
}

function versJournal(ligne: LigneJournal): JournalJour {
  return {
    date: ligne.date,
    humeur: ligne.humeur,
    note: ligne.note,
    clotureLe: ligne.cloture_le,
  };
}

export class DepotSuiviSql {
  constructor(
    private readonly pilote: PiloteSql,
    private readonly maintenant: () => string,
  ) {}

  async journee(date: string): Promise<Journee> {
    const occurrences = await this.pilote.lire<LigneOccurrence>(
      `SELECT occurrences.*, actions.titre
       FROM occurrences
       INNER JOIN actions ON actions.id = occurrences.action_id
       WHERE occurrences.date_prevue = ?
       ORDER BY actions.ordre
       LIMIT 6`,
      [date],
    );
    const journaux = await this.pilote.lire<LigneJournal>('SELECT * FROM journal_jours WHERE date = ?', [date]);
    const journal = journaux.length ? versJournal(journaux[0]) : null;
    return { date, occurrences: occurrences.map(versOccurrence), journal, cloturee: Boolean(journal?.clotureLe) };
  }

  async cocherOccurrence(occurrenceId: string, faite: boolean): Promise<void> {
    await this.pilote.executer(
      'UPDATE occurrences SET statut = ?, fait_le = ? WHERE id = ?',
      [faite ? 'fait' : 'a_faire', faite ? this.maintenant() : null, occurrenceId],
    );
  }

  async enregistrerJournal(date: string, humeur: number | null, note: string): Promise<void> {
    await this.pilote.executer(
      `INSERT INTO journal_jours (date, humeur, note, cloture_le) VALUES (?, ?, ?, NULL)
       ON CONFLICT (date) DO UPDATE SET humeur = excluded.humeur, note = excluded.note`,
      [date, humeur, note.trim()],
    );
  }

  async cloturerJournee(date: string, humeur: number | null, note: string): Promise<void> {
    await this.pilote.executer(
      `INSERT INTO journal_jours (date, humeur, note, cloture_le) VALUES (?, ?, ?, ?)
       ON CONFLICT (date) DO UPDATE SET humeur = excluded.humeur, note = excluded.note, cloture_le = excluded.cloture_le`,
      [date, humeur, note.trim(), this.maintenant()],
    );
    await this.pilote.executer(
      "UPDATE occurrences SET statut = 'manque' WHERE date_prevue = ? AND statut = 'a_faire'",
      [date],
    );
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
node node_modules/vitest/vitest.mjs run tests/donnees/depot-suivi.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/donnees/depot-suivi.ts tests/donnees/depot-suivi.test.ts
git commit -m "feat(donnees): suivi quotidien offline"
```

---

### Task 4: Calcul de constance

**Files:**
- Create: `src/domaine/constance.ts`
- Test: `tests/domaine/constance.test.ts`

**Interfaces:**
- Consumes:
  - `JournalJour`
  - `Occurrence`
  - `ajouterJours(date, jours)`
- Produces:
  - `interface StatistiquesConstance { joursClotures: number; actionsFaites: number; actionsManquees: number; humeurMoyenne: number | null; serie: number }`
  - `calculerSerie(journaux: JournalJour[], aujourdhui: string): number`
  - `calculerStatistiques(journaux: JournalJour[], occurrences: Occurrence[], aujourdhui: string): StatistiquesConstance`

- [ ] **Step 1: Write the failing test**

`tests/domaine/constance.test.ts`:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
node node_modules/vitest/vitest.mjs run tests/domaine/constance.test.ts
```

Expected: FAIL because `src/domaine/constance.ts` does not exist.

- [ ] **Step 3: Implement constance helpers**

Create `src/domaine/constance.ts`:

```ts
import type { JournalJour, Occurrence } from './types';
import { ajouterJours } from './dates';

export interface StatistiquesConstance {
  joursClotures: number;
  actionsFaites: number;
  actionsManquees: number;
  humeurMoyenne: number | null;
  serie: number;
}

export function calculerSerie(journaux: JournalJour[], aujourdhui: string): number {
  const clotures = new Set(journaux.filter((j) => j.clotureLe).map((j) => j.date));
  let serie = 0;
  let date = aujourdhui;
  while (clotures.has(date)) {
    serie += 1;
    date = ajouterJours(date, -1);
  }
  return serie;
}

export function calculerStatistiques(
  journaux: JournalJour[],
  occurrences: Occurrence[],
  aujourdhui: string,
): StatistiquesConstance {
  const humeurs = journaux.map((j) => j.humeur).filter((humeur): humeur is number => humeur !== null);
  return {
    joursClotures: journaux.filter((j) => j.clotureLe).length,
    actionsFaites: occurrences.filter((o) => o.statut === 'fait').length,
    actionsManquees: occurrences.filter((o) => o.statut === 'manque').length,
    humeurMoyenne: humeurs.length ? Math.round((humeurs.reduce((total, h) => total + h, 0) / humeurs.length) * 10) / 10 : null,
    serie: calculerSerie(journaux, aujourdhui),
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
node node_modules/vitest/vitest.mjs run tests/domaine/constance.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domaine/constance.ts tests/domaine/constance.test.ts
git commit -m "feat(domaine): calculer la constance"
```

---

### Task 5: Écran du plan manuel

**Files:**
- Create: `src/ui/ecrans/Plan.tsx`
- Test: `tests/ui/Plan.test.tsx`

**Interfaces:**
- Consumes:
  - `SaisiePlan`
- Produces:
  - `EcranPlan({ bilanId, onCreer }: { bilanId: string; onCreer(saisie: SaisiePlan): Promise<void> | void })`

- [ ] **Step 1: Write the failing test**

`tests/ui/Plan.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EcranPlan } from '../../src/ui/ecrans/Plan';

test('crée une saisie de plan manuel avec une action récurrente', async () => {
  const onCreer = vi.fn();
  render(<EcranPlan bilanId="b1" onCreer={onCreer} />);

  await userEvent.type(screen.getByLabelText('Ambition annuelle'), 'Tenir une direction claire');
  await userEvent.type(screen.getByLabelText('Objectif 1'), 'Écrire');
  await userEvent.type(screen.getByLabelText('Action 1'), 'Écrire 10 lignes');
  await userEvent.click(screen.getByLabelText('Lundi'));
  await userEvent.click(screen.getByLabelText('Mercredi'));
  await userEvent.click(screen.getByRole('button', { name: 'Créer mon plan' }));

  expect(onCreer).toHaveBeenCalledWith({
    bilanId: 'b1',
    ambition: 'Tenir une direction claire',
    objectifs: [{ titre: 'Écrire', actions: [{ titre: 'Écrire 10 lignes', jours: [1, 3] }] }],
  });
});

test('demande au moins une ambition et une action', async () => {
  const onCreer = vi.fn();
  render(<EcranPlan bilanId="b1" onCreer={onCreer} />);
  await userEvent.click(screen.getByRole('button', { name: 'Créer mon plan' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Renseignez une ambition, un objectif, une action et au moins un jour.');
  expect(onCreer).not.toHaveBeenCalled();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
node node_modules/vitest/vitest.mjs run tests/ui/Plan.test.tsx
```

Expected: FAIL because `src/ui/ecrans/Plan.tsx` does not exist.

- [ ] **Step 3: Implement screen**

Create `src/ui/ecrans/Plan.tsx`:

```tsx
import { useState } from 'react';
import type { SaisiePlan } from '../../domaine/types';

const JOURS = [
  [1, 'Lundi'],
  [2, 'Mardi'],
  [3, 'Mercredi'],
  [4, 'Jeudi'],
  [5, 'Vendredi'],
  [6, 'Samedi'],
  [7, 'Dimanche'],
] as const;

export function EcranPlan({ bilanId, onCreer }: { bilanId: string; onCreer(saisie: SaisiePlan): Promise<void> | void }) {
  const [ambition, setAmbition] = useState('');
  const [objectif, setObjectif] = useState('');
  const [action, setAction] = useState('');
  const [jours, setJours] = useState<number[]>([]);
  const [erreur, setErreur] = useState('');

  function basculerJour(jour: number) {
    setJours((actuels) => actuels.includes(jour) ? actuels.filter((j) => j !== jour) : [...actuels, jour].sort());
  }

  async function creer() {
    if (!ambition.trim() || !objectif.trim() || !action.trim() || jours.length === 0) {
      setErreur('Renseignez une ambition, un objectif, une action et au moins un jour.');
      return;
    }
    setErreur('');
    await onCreer({
      bilanId,
      ambition: ambition.trim(),
      objectifs: [{ titre: objectif.trim(), actions: [{ titre: action.trim(), jours }] }],
    });
  }

  return (
    <main>
      <h1>Construire mon plan</h1>
      <label htmlFor="ambition">Ambition annuelle</label>
      <textarea id="ambition" value={ambition} onChange={(e) => setAmbition(e.target.value)} />

      <label htmlFor="objectif1">Objectif 1</label>
      <input id="objectif1" value={objectif} onChange={(e) => setObjectif(e.target.value)} />

      <label htmlFor="action1">Action 1</label>
      <input id="action1" value={action} onChange={(e) => setAction(e.target.value)} />

      <fieldset>
        <legend>Jours prévus</legend>
        {JOURS.map(([valeur, libelle]) => (
          <label key={valeur}>
            <input type="checkbox" checked={jours.includes(valeur)} onChange={() => basculerJour(valeur)} />
            {libelle}
          </label>
        ))}
      </fieldset>

      {erreur && <p role="alert">{erreur}</p>}
      <button type="button" onClick={creer}>Créer mon plan</button>
    </main>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
node node_modules/vitest/vitest.mjs run tests/ui/Plan.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/ui/ecrans/Plan.tsx tests/ui/Plan.test.tsx
git commit -m "feat(ui): écran de plan manuel"
```

---

### Task 6: Écran du jour

**Files:**
- Create: `src/ui/ecrans/Jour.tsx`
- Test: `tests/ui/Jour.test.tsx`

**Interfaces:**
- Consumes:
  - `Journee`
  - `DepotSuiviSql` interface shape: `cocherOccurrence`, `cloturerJournee`
- Produces:
  - `EcranJour({ journee, onCocher, onCloturer, onSuivi }: Props)`

- [ ] **Step 1: Write the failing test**

`tests/ui/Jour.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Journee } from '../../src/donnees/depot-suivi';
import { EcranJour } from '../../src/ui/ecrans/Jour';

function journee(): Journee {
  return {
    date: '2026-09-14',
    journal: null,
    cloturee: false,
    occurrences: Array.from({ length: 7 }, (_, index) => ({
      id: `o${index + 1}`,
      actionId: `a${index + 1}`,
      titre: `Action ${index + 1}`,
      datePrevue: '2026-09-14',
      statut: 'a_faire',
      faitLe: null,
      note: null,
    })),
  };
}

test('affiche au maximum six actions du jour', () => {
  render(<EcranJour journee={journee()} onCocher={vi.fn()} onCloturer={vi.fn()} onSuivi={vi.fn()} />);
  expect(screen.getByText('Action 1')).toBeInTheDocument();
  expect(screen.getByText('Action 6')).toBeInTheDocument();
  expect(screen.queryByText('Action 7')).not.toBeInTheDocument();
  expect(screen.getByText('1 action en plus reste hors de l écran du jour.')).toBeInTheDocument();
});

test('coche une action et clôture avec humeur et note', async () => {
  const onCocher = vi.fn();
  const onCloturer = vi.fn();
  render(<EcranJour journee={journee()} onCocher={onCocher} onCloturer={onCloturer} onSuivi={vi.fn()} />);

  await userEvent.click(screen.getByLabelText('Action 1'));
  expect(onCocher).toHaveBeenCalledWith('o1', true);

  await userEvent.click(screen.getByRole('button', { name: '4' }));
  await userEvent.type(screen.getByLabelText('Note du jour'), 'Bonne reprise');
  await userEvent.click(screen.getByRole('button', { name: 'Clôturer ma journée' }));

  expect(onCloturer).toHaveBeenCalledWith(4, 'Bonne reprise');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
node node_modules/vitest/vitest.mjs run tests/ui/Jour.test.tsx
```

Expected: FAIL because `src/ui/ecrans/Jour.tsx` does not exist.

- [ ] **Step 3: Implement screen**

Create `src/ui/ecrans/Jour.tsx`:

```tsx
import { useState } from 'react';
import type { Journee } from '../../donnees/depot-suivi';

interface Props {
  journee: Journee;
  onCocher(occurrenceId: string, faite: boolean): Promise<void> | void;
  onCloturer(humeur: number | null, note: string): Promise<void> | void;
  onSuivi(): void;
}

export function EcranJour({ journee, onCocher, onCloturer, onSuivi }: Props) {
  const visibles = journee.occurrences.slice(0, 6);
  const reste = Math.max(0, journee.occurrences.length - visibles.length);
  const [humeur, setHumeur] = useState<number | null>(journee.journal?.humeur ?? null);
  const [note, setNote] = useState(journee.journal?.note ?? '');

  return (
    <main>
      <h1>Aujourd'hui</h1>
      <p>{journee.date}</p>

      {visibles.map((occurrence) => (
        <label key={occurrence.id}>
          <input
            type="checkbox"
            checked={occurrence.statut === 'fait'}
            onChange={(e) => onCocher(occurrence.id, e.currentTarget.checked)}
            disabled={journee.cloturee}
          />
          {occurrence.titre}
        </label>
      ))}

      {reste > 0 && <p>{reste} action en plus reste hors de l écran du jour.</p>}

      <div aria-label="Humeur">
        {[1, 2, 3, 4, 5].map((valeur) => (
          <button type="button" key={valeur} aria-pressed={humeur === valeur} onClick={() => setHumeur(valeur)}>
            {valeur}
          </button>
        ))}
      </div>

      <label htmlFor="note">Note du jour</label>
      <textarea id="note" value={note} onChange={(e) => setNote(e.target.value)} />

      <button type="button" onClick={() => onCloturer(humeur, note)} disabled={journee.cloturee}>
        {journee.cloturee ? 'Journée clôturée' : 'Clôturer ma journée'}
      </button>
      <button type="button" onClick={onSuivi}>Suivi</button>
    </main>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
node node_modules/vitest/vitest.mjs run tests/ui/Jour.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/ui/ecrans/Jour.tsx tests/ui/Jour.test.tsx
git commit -m "feat(ui): écran du jour"
```

---

### Task 7: Vue de suivi

**Files:**
- Create: `src/ui/ecrans/Suivi.tsx`
- Test: `tests/ui/Suivi.test.tsx`

**Interfaces:**
- Consumes:
  - `StatistiquesConstance`
- Produces:
  - `EcranSuivi({ statistiques, onRetour }: { statistiques: StatistiquesConstance; onRetour(): void })`

- [ ] **Step 1: Write the failing test**

`tests/ui/Suivi.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EcranSuivi } from '../../src/ui/ecrans/Suivi';

test('affiche les statistiques de constance', async () => {
  const onRetour = vi.fn();
  render(<EcranSuivi statistiques={{
    joursClotures: 5,
    actionsFaites: 12,
    actionsManquees: 3,
    humeurMoyenne: 4.2,
    serie: 3,
  }} onRetour={onRetour} />);

  expect(screen.getByText('5 jours clôturés')).toBeInTheDocument();
  expect(screen.getByText('12 actions faites')).toBeInTheDocument();
  expect(screen.getByText('3 actions manquées')).toBeInTheDocument();
  expect(screen.getByText('Humeur moyenne 4.2 / 5')).toBeInTheDocument();
  expect(screen.getByText('Série actuelle 3 jours')).toBeInTheDocument();

  await userEvent.click(screen.getByRole('button', { name: 'Retour' }));
  expect(onRetour).toHaveBeenCalled();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
node node_modules/vitest/vitest.mjs run tests/ui/Suivi.test.tsx
```

Expected: FAIL because `src/ui/ecrans/Suivi.tsx` does not exist.

- [ ] **Step 3: Implement screen**

Create `src/ui/ecrans/Suivi.tsx`:

```tsx
import type { StatistiquesConstance } from '../../domaine/constance';

export function EcranSuivi({ statistiques, onRetour }: { statistiques: StatistiquesConstance; onRetour(): void }) {
  return (
    <main>
      <h1>Suivi</h1>
      <p>{statistiques.joursClotures} jours clôturés</p>
      <p>{statistiques.actionsFaites} actions faites</p>
      <p>{statistiques.actionsManquees} actions manquées</p>
      <p>Humeur moyenne {statistiques.humeurMoyenne ?? '-'} / 5</p>
      <p>Série actuelle {statistiques.serie} jours</p>
      <button type="button" onClick={onRetour}>Retour</button>
    </main>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
node node_modules/vitest/vitest.mjs run tests/ui/Suivi.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/ui/ecrans/Suivi.tsx tests/ui/Suivi.test.tsx
git commit -m "feat(ui): vue de constance"
```

---

### Task 8: Aiguillage App vers plan, jour et suivi

**Files:**
- Modify: `src/ui/App.tsx`
- Test: `tests/ui/App.test.tsx`

**Interfaces:**
- Consumes:
  - `DepotBilanSql`
  - `DepotPlanSql`
  - `DepotSuiviSql`
  - `EcranPlan`
  - `EcranJour`
  - `EcranSuivi`
  - `aujourdhuiLocal()`
  - `calculerStatistiques()`
- Produces:
  - `App()` routes:
    - no settings -> `Demarrage`
    - bilan brouillon -> `EcranBilan`
    - bilan gelé without active plan -> `EcranPlan`
    - active plan -> `EcranJour`
    - suivi button -> `EcranSuivi`

- [ ] **Step 1: Replace App test with routing coverage**

Update `tests/ui/App.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PiloteNode } from '../../src/donnees/pilote-node';
import { migrer } from '../../src/donnees/migrer';
import { DepotParametresSql } from '../../src/donnees/depot-parametres';
import { DepotBilanSql } from '../../src/donnees/depot-bilan';
import { DepotPlanSql } from '../../src/donnees/depot-plan';
import { App } from '../../src/ui/App';

let pilote: PiloteNode;

vi.mock('../../src/donnees/base', () => ({
  obtenirBase: async () => pilote,
}));

async function baseNeuve() {
  pilote = new PiloteNode();
  await migrer(pilote);
  return pilote;
}

test("propose le premier lancement quand aucun réglage n'existe", async () => {
  await baseNeuve();
  render(<App />);
  expect(await screen.findByRole('heading', { name: 'Bienvenue' })).toBeInTheDocument();
});

test('propose le plan quand le bilan est gelé sans plan actif', async () => {
  const base = await baseNeuve();
  await new DepotParametresSql(base).enregistrer({ prenom: 'Yannick', fuseau: 'Europe/Paris', heureRappel: '20:00' });
  const depotBilan = new DepotBilanSql(base, () => '2026-09-14');
  const bilan = await depotBilan.creerBrouillon();
  await depotBilan.geler(bilan.id);

  render(<App />);
  expect(await screen.findByRole('heading', { name: 'Construire mon plan' })).toBeInTheDocument();
});

test('affiche le jour quand un plan actif existe', async () => {
  const base = await baseNeuve();
  await new DepotParametresSql(base).enregistrer({ prenom: 'Yannick', fuseau: 'Europe/Paris', heureRappel: '20:00' });
  const depotBilan = new DepotBilanSql(base, () => '2026-09-14');
  const bilan = await depotBilan.creerBrouillon();
  await depotBilan.geler(bilan.id);
  await new DepotPlanSql(base, () => '2026-09-14').creerDepuisBilanGele({
    bilanId: bilan.id,
    ambition: 'Tenir une direction claire',
    objectifs: [{ titre: 'Écrire', actions: [{ titre: 'Écrire 10 lignes', jours: [1] }] }],
  });

  render(<App />);
  expect(await screen.findByRole('heading', { name: "Aujourd'hui" })).toBeInTheDocument();
  expect(screen.getByText('Écrire 10 lignes')).toBeInTheDocument();

  await userEvent.click(screen.getByRole('button', { name: 'Suivi' }));
  expect(await screen.findByRole('heading', { name: 'Suivi' })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
node node_modules/vitest/vitest.mjs run tests/ui/App.test.tsx
```

Expected: FAIL because `App` still routes a gelé bilan to `Bilan terminé`.

- [ ] **Step 3: Update App routing**

Modify `src/ui/App.tsx`:

```tsx
import { useEffect, useMemo, useState } from 'react';
import { obtenirBase } from '../donnees/base';
import type { PiloteSql } from '../donnees/pilote';
import { DepotBilanSql } from '../donnees/depot-bilan';
import { DepotParametresSql, type Reglages } from '../donnees/depot-parametres';
import { DepotPlanSql } from '../donnees/depot-plan';
import { DepotSuiviSql, type Journee } from '../donnees/depot-suivi';
import { calculerStatistiques, type StatistiquesConstance } from '../domaine/constance';
import { aujourdhuiLocal } from '../domaine/dates';
import type { Bilan, Plan, SaisiePlan } from '../domaine/types';
import { Demarrage } from './ecrans/Demarrage';
import { EcranBilan } from './ecrans/Bilan';
import { EcranJour } from './ecrans/Jour';
import { EcranPlan } from './ecrans/Plan';
import { EcranReglages } from './ecrans/Reglages';
import { EcranSuivi } from './ecrans/Suivi';

type Etape = 'chargement' | 'demarrage' | 'bilan' | 'plan' | 'jour' | 'suivi' | 'reglages';

export function App() {
  const [pilote, setPilote] = useState<PiloteSql | null>(null);
  const [etape, setEtape] = useState<Etape>('chargement');
  const [bilan, setBilan] = useState<Bilan | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [journee, setJournee] = useState<Journee | null>(null);
  const [statistiques, setStatistiques] = useState<StatistiquesConstance | null>(null);
  const [erreur, setErreur] = useState('');

  const depotBilan = useMemo(() => (pilote ? new DepotBilanSql(pilote) : null), [pilote]);

  async function chargerJournee(base: PiloteSql, planActif: Plan) {
    const suivi = new DepotSuiviSql(base, () => aujourdhuiLocal());
    const date = aujourdhuiLocal();
    setPlan(planActif);
    setJournee(await suivi.journee(date));
    setEtape('jour');
  }

  useEffect(() => {
    (async () => {
      const base = await obtenirBase();
      setPilote(base);
      const reglages = await new DepotParametresSql(base).lire();
      if (!reglages) { setEtape('demarrage'); return; }
      const depot = new DepotBilanSql(base);
      const courant = (await depot.bilanCourant()) ?? (await depot.creerBrouillon());
      setBilan(courant);
      if (courant.statut !== 'gele') { setEtape('bilan'); return; }
      const planActif = await new DepotPlanSql(base, () => aujourdhuiLocal()).planActif();
      if (!planActif) { setEtape('plan'); return; }
      await chargerJournee(base, planActif);
    })();
  }, []);

  async function demarrer(reglages: Reglages) {
    try {
      await new DepotParametresSql(pilote!).enregistrer(reglages);
      const depot = new DepotBilanSql(pilote!);
      setBilan(await depot.creerBrouillon());
      setEtape('bilan');
      setErreur('');
    } catch (e) {
      setErreur(`Le démarrage a échoué : ${String(e)}. Réessayez.`);
    }
  }

  async function terminerBilan() {
    try {
      await new DepotBilanSql(pilote!).geler(bilan!.id);
      setEtape('plan');
      setErreur('');
    } catch (e) {
      setErreur(`La clôture du bilan a échoué : ${String(e)}. Vos réponses restent enregistrées, réessayez.`);
    }
  }

  async function creerPlan(saisie: SaisiePlan) {
    const planCree = await new DepotPlanSql(pilote!, () => aujourdhuiLocal()).creerDepuisBilanGele(saisie);
    await chargerJournee(pilote!, planCree);
  }

  async function rafraichirJournee() {
    setJournee(await new DepotSuiviSql(pilote!, () => aujourdhuiLocal()).journee(aujourdhuiLocal()));
  }

  async function cocher(occurrenceId: string, faite: boolean) {
    await new DepotSuiviSql(pilote!, () => aujourdhuiLocal()).cocherOccurrence(occurrenceId, faite);
    await rafraichirJournee();
  }

  async function cloturer(humeur: number | null, note: string) {
    await new DepotSuiviSql(pilote!, () => aujourdhuiLocal()).cloturerJournee(aujourdhuiLocal(), humeur, note);
    await rafraichirJournee();
  }

  async function afficherSuivi() {
    const depotPlan = new DepotPlanSql(pilote!, () => aujourdhuiLocal());
    const actif = plan ?? await depotPlan.planActif();
    const occurrences = actif ? await depotPlan.occurrences(actif.id) : [];
    const journaux = await pilote!.lire<{ date: string; humeur: number | null; note: string | null; cloture_le: string | null }>('SELECT * FROM journal_jours ORDER BY date');
    setStatistiques(calculerStatistiques(
      journaux.map((j) => ({ date: j.date, humeur: j.humeur, note: j.note, clotureLe: j.cloture_le })),
      occurrences,
      aujourdhuiLocal(),
    ));
    setEtape('suivi');
  }

  if (etape === 'chargement' || !pilote) return <p>Chargement…</p>;
  if (etape === 'demarrage') return <>{erreur && <p role="alert">{erreur}</p>}<Demarrage onValider={demarrer} /></>;
  if (etape === 'bilan' && bilan && depotBilan) return <>{erreur && <p role="alert">{erreur}</p>}<EcranBilan depot={depotBilan} bilan={bilan} onTermine={terminerBilan} /></>;
  if (etape === 'plan' && bilan) return <EcranPlan bilanId={bilan.id} onCreer={creerPlan} />;
  if (etape === 'jour' && journee) return <EcranJour journee={journee} onCocher={cocher} onCloturer={cloturer} onSuivi={afficherSuivi} />;
  if (etape === 'suivi' && statistiques) return <EcranSuivi statistiques={statistiques} onRetour={() => setEtape('jour')} />;
  if (etape === 'reglages') return <EcranReglages pilote={pilote} onRetour={() => setEtape(plan ? 'jour' : 'plan')} />;

  return <p>Chargement…</p>;
}
```

- [ ] **Step 4: Run App test to verify it passes**

Run:

```bash
node node_modules/vitest/vitest.mjs run tests/ui/App.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/ui/App.tsx tests/ui/App.test.tsx
git commit -m "feat(ui): aiguiller vers routine quotidienne"
```

---

### Task 9: Export résumé de routine

**Files:**
- Modify: `src/donnees/export.ts`
- Test: `tests/donnees/export.test.ts`

**Interfaces:**
- Consumes:
  - `PiloteSql`
- Produces:
  - `exporterResumeRoutine(pilote: PiloteSql): Promise<string>`

- [ ] **Step 1: Add failing test**

Append to `tests/donnees/export.test.ts`:

```ts
import { DepotPlanSql } from '../../src/donnees/depot-plan';
import { DepotSuiviSql } from '../../src/donnees/depot-suivi';
import { exporterResumeRoutine } from '../../src/donnees/export';

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
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
node node_modules/vitest/vitest.mjs run tests/donnees/export.test.ts
```

Expected: FAIL because `exporterResumeRoutine` is not exported.

- [ ] **Step 3: Implement routine summary**

Append to `src/donnees/export.ts`:

```ts
export async function exporterResumeRoutine(pilote: PiloteSql): Promise<string> {
  const plans = await pilote.lire<{ id: string; ambition: string }>("SELECT id, ambition FROM plans WHERE statut = 'actif' ORDER BY rowid DESC LIMIT 1");
  if (!plans.length) return 'Aucun plan actif.';
  const plan = plans[0];
  const objectifs = await pilote.lire<{ titre: string }>('SELECT titre FROM objectifs WHERE plan_id = ? ORDER BY ordre', [plan.id]);
  const actions = await pilote.lire<{ titre: string }>('SELECT titre FROM actions WHERE plan_id = ? ORDER BY ordre', [plan.id]);
  const journaux = await pilote.lire<{ date: string; humeur: number | null; note: string | null; cloture_le: string | null }>(
    'SELECT * FROM journal_jours WHERE cloture_le IS NOT NULL ORDER BY date',
  );

  const lignes = [
    'Childeric - résumé de routine',
    `Ambition : ${plan.ambition}`,
    '',
    ...objectifs.map((objectif) => `Objectif : ${objectif.titre}`),
    ...actions.map((action) => `Action : ${action.titre}`),
    '',
    `Jours clôturés : ${journaux.length}`,
    ...journaux.flatMap((jour) => [
      `${jour.date} - humeur ${jour.humeur ?? '-'}/5`,
      ...(jour.note ? [`Note : ${jour.note}`] : []),
    ]),
  ];

  return lignes.join('\n');
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
node node_modules/vitest/vitest.mjs run tests/donnees/export.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/donnees/export.ts tests/donnees/export.test.ts
git commit -m "feat(export): résumé textuel de routine"
```

---

### Task 10: Vérification complète

**Files:**
- Modify: `README.md`
- Modify: `VERIFICATION-v0.1.md`

**Interfaces:**
- Consumes: all previous tasks
- Produces: updated documentation and verified build/test evidence

- [ ] **Step 1: Update README**

Change `README.md` "État du projet" to say the next local routine is implemented once Tasks 1-9 are complete. Add a short section:

```md
## Routine offline

Après le bilan gelé, Childeric permet de créer un plan manuel, de générer les 8 premières semaines d'actions, puis de suivre chaque journée avec actions à cocher, humeur, note et clôture. Cette boucle reste 100% locale.
```

- [ ] **Step 2: Update verification doc**

Append to `VERIFICATION-v0.1.md`:

```md
## Vérification routine offline

1. Terminer ou conserver un bilan gelé.
2. Depuis l'écran de plan, saisir une ambition, un objectif, une action et au moins un jour.
3. Créer le plan : l'écran "Aujourd'hui" apparaît.
4. Cocher une action, choisir une humeur, saisir une note.
5. Clôturer la journée : l'action restante éventuelle passe à manquée.
6. Ouvrir le suivi : la série, les jours clôturés et les actions se mettent à jour.
7. Exporter les données : le JSON contient plans, objectifs, actions, occurrences et journal.
```

- [ ] **Step 3: Run full tests**

Run:

```bash
node node_modules/vitest/vitest.mjs run
```

Expected: all tests PASS.

- [ ] **Step 4: Run typecheck**

Run:

```bash
node node_modules/typescript/bin/tsc --noEmit
```

Expected: exit code 0.

- [ ] **Step 5: Run production build**

Run:

```bash
node node_modules/vite/bin/vite.js build
```

Expected: exit code 0 and `dist/` generated.

- [ ] **Step 6: Commit docs and final verification**

```bash
git add README.md VERIFICATION-v0.1.md
git commit -m "docs: vérifier la routine offline"
```
