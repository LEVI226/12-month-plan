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

export async function exporterResumeRoutine(pilote: PiloteSql): Promise<string> {
  const plans = await pilote.lire<{ id: string; ambition: string }>(
    "SELECT id, ambition FROM plans WHERE statut = 'actif' ORDER BY rowid DESC LIMIT 1",
  );
  if (!plans.length) return 'Aucun plan actif.';

  const plan = plans[0];
  const objectifs = await pilote.lire<{ titre: string }>(
    'SELECT titre FROM objectifs WHERE plan_id = ? ORDER BY ordre',
    [plan.id],
  );
  const actions = await pilote.lire<{ titre: string }>(
    'SELECT titre FROM actions WHERE plan_id = ? ORDER BY ordre',
    [plan.id],
  );
  const journaux = await pilote.lire<{ date: string; humeur: number | null; note: string | null }>(
    'SELECT date, humeur, note FROM journal_jours WHERE cloture_le IS NOT NULL ORDER BY date',
  );

  const lignes = [
    'Childeric - résumé de routine',
    `Ambition : ${plan.ambition}`,
    '',
    ...objectifs.map((objectif) => `Objectif : ${objectif.titre}`),
    ...actions.map((action) => `Action : ${action.titre}`),
    '',
    `Jours clôturés : ${journaux.length}`,
    ...journaux.flatMap((jour) => [
      `${jour.date} - humeur ${jour.humeur ?? '-'}/5`,
      ...(jour.note ? [`Note : ${jour.note}`] : []),
    ]),
  ];

  return lignes.join('\n');
}
