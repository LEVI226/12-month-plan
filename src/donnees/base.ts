import type { PiloteSql } from './pilote';
import { migrer } from './migrer';

let base: PiloteSql | null = null;

export async function obtenirBase(): Promise<PiloteSql> {
  if (base) return base;
  const { PiloteCapacitor } = await import('./pilote-capacitor');
  const pilote = await PiloteCapacitor.ouvrir();
  await migrer(pilote);
  base = pilote;
  return base;
}
