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
