import type { Bilan } from '../../src/domaine/types';
import { BilanGeleErreur, type DepotBilan } from '../../src/donnees/depot-bilan';
import { QUESTIONS, VERSION_CATALOGUE } from '../../src/domaine/questions';

/** Double de test du dépôt de bilan, entièrement en mémoire. Aucun SQL, aucun node:sqlite. */
export class DepotBilanMemoire implements DepotBilan {
  private bilans: Bilan[] = [];
  private valeurs = new Map<string, Map<string, string>>();
  private compteur = 0;

  constructor(private readonly maintenant: () => string = () => '2026-09-10') {}

  async creerBrouillon(): Promise<Bilan> {
    this.compteur += 1;
    const bilan: Bilan = {
      id: `bilan-${this.compteur}`,
      statut: 'brouillon',
      versionCatalogue: VERSION_CATALOGUE,
      creeLe: this.maintenant(),
      geleLe: null,
    };
    this.bilans.push(bilan);
    this.valeurs.set(bilan.id, new Map());
    return bilan;
  }

  async bilanCourant(): Promise<Bilan | null> {
    return this.bilans.length ? this.bilans[this.bilans.length - 1] : null;
  }

  private exigerBrouillon(bilanId: string): Bilan {
    const bilan = this.bilans.find((candidat) => candidat.id === bilanId);
    if (!bilan) throw new Error(`Bilan introuvable : ${bilanId}`);
    if (bilan.statut === 'gele') throw new BilanGeleErreur();
    return bilan;
  }

  async repondre(bilanId: string, questionCode: string, valeur: string): Promise<void> {
    this.exigerBrouillon(bilanId);
    const carte = this.valeurs.get(bilanId)!;
    const propre = valeur.trim();
    if (propre === '') carte.delete(questionCode);
    else carte.set(questionCode, propre);
  }

  async reponses(bilanId: string): Promise<Record<string, string>> {
    return Object.fromEntries(this.valeurs.get(bilanId) ?? new Map());
  }

  async progression(bilanId: string): Promise<{ repondues: number; total: number }> {
    return { repondues: this.valeurs.get(bilanId)?.size ?? 0, total: QUESTIONS.length };
  }

  async geler(bilanId: string): Promise<Bilan> {
    const bilan = this.exigerBrouillon(bilanId);
    const gele: Bilan = { ...bilan, statut: 'gele', geleLe: this.maintenant() };
    this.bilans[this.bilans.indexOf(bilan)] = gele;
    return gele;
  }
}
