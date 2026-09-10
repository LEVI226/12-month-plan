import type { PiloteSql } from './pilote';

export interface Reglages {
  prenom: string;
  fuseau: string;
  heureRappel: string;
}

const CLES: (keyof Reglages)[] = ['prenom', 'fuseau', 'heureRappel'];

export class DepotParametresSql {
  constructor(private readonly pilote: PiloteSql) {}

  async lire(): Promise<Reglages | null> {
    const lignes = await this.pilote.lire<{ cle: string; valeur: string }>('SELECT cle, valeur FROM parametres');
    const carte = new Map(lignes.map((l) => [l.cle, l.valeur]));
    if (!CLES.every((cle) => carte.has(cle))) return null;
    return {
      prenom: carte.get('prenom')!,
      fuseau: carte.get('fuseau')!,
      heureRappel: carte.get('heureRappel')!,
    };
  }

  async enregistrer(reglages: Reglages): Promise<void> {
    for (const cle of CLES) {
      await this.pilote.executer(
        `INSERT INTO parametres (cle, valeur) VALUES (?, ?)
         ON CONFLICT (cle) DO UPDATE SET valeur = excluded.valeur`,
        [cle, reglages[cle]],
      );
    }
  }
}
