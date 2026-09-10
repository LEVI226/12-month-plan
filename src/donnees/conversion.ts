/** Convertit le résultat d'une requête Capacitor SQLite en tableau de lignes. */
export function extraireLignes<T>(resultat: { values?: unknown[] }): T[] {
  return (resultat.values ?? []) as T[];
}
