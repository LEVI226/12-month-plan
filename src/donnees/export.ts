import type { PiloteSql } from './pilote';

const TABLES = [
  'parametres', 'bilans', 'reponses', 'plans', 'objectifs', 'jalons',
  'actions', 'occurrences', 'journal_jours', 'notifications', 'generations_ia',
] as const;

export async function exporterTout(pilote: PiloteSql): Promise<string> {
  const [{ user_version: versionSchema }] = await pilote.lire<{ user_version: number }>('PRAGMA user_version');
  const tables: Record<string, unknown[]> = {};
  for (const table of TABLES) {
    tables[table] = await pilote.lire(`SELECT * FROM ${table}`);
  }
  return JSON.stringify({ application: 'childeric', versionSchema, exporteLe: new Date().toISOString(), tables }, null, 2);
}

export async function supprimerTout(pilote: PiloteSql): Promise<void> {
  for (const table of [...TABLES].reverse()) {
    await pilote.executer(`DELETE FROM ${table}`);
  }
}
