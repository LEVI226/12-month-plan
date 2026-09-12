export type Section = 'personnel' | 'professionnel';
export type TypeReponse = 'texte_court' | 'texte_long';

export interface Question {
  code: string;
  section: Section;
  /** Numéro de la question dans la fiche papier d'origine. */
  groupe: number;
  ordre: number;
  intitule: string;
  aide?: string;
  type: TypeReponse;
  obligatoire: boolean;
}

export type StatutBilan = 'brouillon' | 'gele';

export interface Bilan {
  id: string;
  statut: StatutBilan;
  versionCatalogue: number;
  creeLe: string;
  geleLe: string | null;
}

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
