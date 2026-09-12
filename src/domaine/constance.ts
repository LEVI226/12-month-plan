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
