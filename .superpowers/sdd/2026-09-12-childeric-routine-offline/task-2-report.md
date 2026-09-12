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

---

# Fix round 1

## Finding

`creerDepuisBilanGele` enchaînait plusieurs écritures dépendantes sans transaction explicite : archivage du plan actif, insertion du nouveau plan, insertion des objectifs/actions, puis génération des occurrences. Une erreur tardive pouvait laisser un nouveau plan actif partiel ou archiver l'ancien plan sans création complète.

## Fix summary

- Ajout d'un test de régression simulant un échec sur l'insertion d'une action après l'archivage et l'insertion du nouveau plan.
- Encapsulation de l'archivage, de la création du plan complet et de la génération des occurrences dans une transaction SQLite explicite `BEGIN` / `COMMIT`.
- Ajout d'un `ROLLBACK` en cas d'erreur pour restaurer l'ancien plan actif et éviter tout plan partiel.

## Commands run

Commande RED :

```bash
node node_modules/vitest/vitest.mjs run tests/donnees/depot-plan.test.ts
```

Résumé de sortie RED :

- Exit code : 1
- Résultat : `Test Files 1 failed (1)`, `Tests 1 failed | 4 passed (5)`
- Échec attendu : `planActif()` renvoyait le nouveau plan partiel au lieu du plan initial après l'erreur simulée.

Commande GREEN :

```bash
node node_modules/vitest/vitest.mjs run tests/donnees/depot-plan.test.ts
```

Résumé de sortie GREEN :

- Exit code : 0
- Résultat : `Test Files 1 passed (1)`, `Tests 5 passed (5)`
- Note : Node affiche toujours l'avertissement expérimental existant pour `node:sqlite`.
