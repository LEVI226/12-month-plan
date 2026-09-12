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
       ORDER BY actions.ordre`,
      [date],
    );
    const journaux = await this.pilote.lire<LigneJournal>('SELECT * FROM journal_jours WHERE date = ?', [date]);
    const journal = journaux.length ? versJournal(journaux[0]) : null;
    return { date, occurrences: occurrences.map(versOccurrence), journal, cloturee: Boolean(journal?.clotureLe) };
  }

  async journaux(): Promise<JournalJour[]> {
    const lignes = await this.pilote.lire<LigneJournal>('SELECT * FROM journal_jours ORDER BY date');
    return lignes.map(versJournal);
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
