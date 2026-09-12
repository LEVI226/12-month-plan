# Rapport Task 2 - Dépôt du plan manuel et génération des occurrences

## Statut

Terminé.

## Fichiers modifiés

- `src/donnees/depot-plan.ts` créé.
- `tests/donnees/depot-plan.test.ts` créé.

## Commits faits

- `eb39ff1` - `feat(donnees): plan manuel et occurrences huit semaines`

## RED

Commande :

```bash
node node_modules/vitest/vitest.mjs run tests/donnees/depot-plan.test.ts
```

Résumé de sortie :

- Exit code : 1
- Résultat : échec attendu.
- Cause observée : `Cannot find module '../../src/donnees/depot-plan' imported from ... tests/donnees/depot-plan.test.ts`
- Vitest : `Test Files 1 failed (1)`, `Tests no tests`

## GREEN

Commande :

```bash
node node_modules/vitest/vitest.mjs run tests/donnees/depot-plan.test.ts
```

Résumé de sortie :

- Exit code : 0
- Résultat : `Test Files 1 passed (1)`, `Tests 4 passed (4)`
- Note : Node affiche l'avertissement expérimental existant pour `node:sqlite`.

## Notes d'auto-revue

- Le dépôt refuse un plan depuis un bilan non gelé.
- La validation couvre l'ambition vide, le nombre d'objectifs, les titres vides, les actions absentes et les jours ISO hors plage.
- La création archive les plans actifs existants, insère un plan manuel actif, ses objectifs et ses actions récurrentes.
- Les occurrences sont générées sur 8 semaines à partir de la date civile locale fournie par `maintenant`.
- L'idempotence repose sur la contrainte unique `(action_id, date_prevue)` et `INSERT OR IGNORE`.
- Aucune requête SQL ajoutée hors de `src/donnees`.

## Points d'attention

- La commande ciblée passe avec l'avertissement Node standard : `SQLite is an experimental feature and might change at any time`.
