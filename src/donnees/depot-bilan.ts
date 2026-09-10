import type { PiloteSql } from './pilote';
import type { Bilan } from '../domaine/types';
import { QUESTIONS, VERSION_CATALOGUE } from '../domaine/questions';

export class BilanGeleErreur extends Error {
  constructor(message = 'Ce bilan est gelé et ne peut plus être modifié.') {
    super(message);
    this.name = 'BilanGeleErreur';
  }
}

export interface DepotBilan {
  creerBrouillon(): Promise<Bilan>;
  bilanCourant(): Promise<Bilan | null>;
  repondre(bilanId: string, questionCode: string, valeur: string): Promise<void>;
  reponses(bilanId: string): Promise<Record<string, string>>;
  progression(bilanId: string): Promise<{ repondues: number; total: number }>;
  geler(bilanId: string): Promise<Bilan>;
}

interface LigneBilan {
  id: string;
  statut: 'brouillon' | 'gele';
  version_catalogue: number;
  cree_le: string;
  gele_le: string | null;
}

function versBilan(ligne: LigneBilan): Bilan {
  return {
    id: ligne.id,
    statut: ligne.statut,
    versionCatalogue: ligne.version_catalogue,
    creeLe: ligne.cree_le,
    geleLe: ligne.gele_le,
  };
}

function aujourdHuiLocal(): string {
  const maintenant = new Date();
  const mois = String(maintenant.getMonth() + 1).padStart(2, '0');
  const jour = String(maintenant.getDate()).padStart(2, '0');
  return `${maintenant.getFullYear()}-${mois}-${jour}`;
}

export class DepotBilanSql implements DepotBilan {
  constructor(
    private readonly pilote: PiloteSql,
    private readonly maintenant: () => string = aujourdHuiLocal,
  ) {}

  async creerBrouillon(): Promise<Bilan> {
    const id = crypto.randomUUID();
    await this.pilote.executer(
      'INSERT INTO bilans (id, statut, version_catalogue, cree_le) VALUES (?, ?, ?, ?)',
      [id, 'brouillon', VERSION_CATALOGUE, this.maintenant()],
    );
    return { id, statut: 'brouillon', versionCatalogue: VERSION_CATALOGUE, creeLe: this.maintenant(), geleLe: null };
  }

  async bilanCourant(): Promise<Bilan | null> {
    const lignes = await this.pilote.lire<LigneBilan>(
      'SELECT * FROM bilans ORDER BY cree_le DESC, rowid DESC LIMIT 1',
    );
    return lignes.length ? versBilan(lignes[0]) : null;
  }

  private async exigerBrouillon(bilanId: string): Promise<void> {
    const lignes = await this.pilote.lire<LigneBilan>('SELECT * FROM bilans WHERE id = ?', [bilanId]);
    if (!lignes.length) throw new Error(`Bilan introuvable : ${bilanId}`);
    if (lignes[0].statut === 'gele') throw new BilanGeleErreur();
  }

  async repondre(bilanId: string, questionCode: string, valeur: string): Promise<void> {
    await this.exigerBrouillon(bilanId);
    const propre = valeur.trim();
    if (propre === '') {
      await this.pilote.executer('DELETE FROM reponses WHERE bilan_id = ? AND question_code = ?', [bilanId, questionCode]);
      return;
    }
    await this.pilote.executer(
      `INSERT INTO reponses (bilan_id, question_code, valeur, maj_le) VALUES (?, ?, ?, ?)
       ON CONFLICT (bilan_id, question_code) DO UPDATE SET valeur = excluded.valeur, maj_le = excluded.maj_le`,
      [bilanId, questionCode, propre, this.maintenant()],
    );
  }

  async reponses(bilanId: string): Promise<Record<string, string>> {
    const lignes = await this.pilote.lire<{ question_code: string; valeur: string }>(
      'SELECT question_code, valeur FROM reponses WHERE bilan_id = ?',
      [bilanId],
    );
    return Object.fromEntries(lignes.map((l) => [l.question_code, l.valeur]));
  }

  async progression(bilanId: string): Promise<{ repondues: number; total: number }> {
    const lignes = await this.pilote.lire<{ n: number }>(
      'SELECT COUNT(*) AS n FROM reponses WHERE bilan_id = ?',
      [bilanId],
    );
    return { repondues: lignes[0].n, total: QUESTIONS.length };
  }

  async geler(bilanId: string): Promise<Bilan> {
    await this.exigerBrouillon(bilanId);
    const date = this.maintenant();
    await this.pilote.executer('UPDATE bilans SET statut = ?, gele_le = ? WHERE id = ?', ['gele', date, bilanId]);
    const [ligne] = await this.pilote.lire<LigneBilan>('SELECT * FROM bilans WHERE id = ?', [bilanId]);
    return versBilan(ligne);
  }
}
