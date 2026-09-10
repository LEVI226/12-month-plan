import type { PiloteSql } from './pilote';
import { MIGRATIONS } from './migrations';

/** Applique les migrations manquantes. Renvoie la version de schéma atteinte. */
export async function migrer(pilote: PiloteSql): Promise<number> {
  const [{ user_version: actuelle }] = await pilote.lire<{ user_version: number }>(
    'PRAGMA user_version',
  );

  let version = actuelle;
  for (const migration of MIGRATIONS) {
    if (migration.version <= version) continue;
    await pilote.executer(migration.sql);
    await pilote.executer(`PRAGMA user_version = ${migration.version}`);
    version = migration.version;
  }
  return version;
}
