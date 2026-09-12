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
