# Childeric — Spécification routine offline

**Date :** 2026-09-12  
**Statut :** proposée, à valider avant plan d'implémentation  
**Périmètre :** prolonger la v0.1 locale pour transformer le bilan gelé en plan d'action quotidien utilisable pendant 8 semaines, sans compte ni serveur.

---

## 1. Intention produit

Childeric ne doit pas devenir une app de productivité générique. Sa valeur est de transformer un bilan personnel et professionnel en une routine assez légère pour tenir dans la durée.

Le critère de succès de cette tranche est simple : après avoir gelé son bilan, l'utilisateur peut créer un plan offline, ouvrir l'application chaque jour, cocher trois à six actions, indiquer son humeur, écrire une note courte si besoin, puis clôturer la journée. Cette boucle doit être assez claire pour être répétée pendant 8 semaines.

Cette version ne cherche pas encore à générer un plan parfait. Elle cherche à rendre le plan vivant.

## 2. Décisions structurantes

| Sujet | Décision | Raison |
|---|---|---|
| Mode | 100% offline | Valider l'usage personnel avant toute complexité serveur |
| Création du plan | Saisie manuelle guidée | Évite l'IA et garde la boucle testable immédiatement |
| Durée visible | 8 semaines actives, dans un modèle 12 mois | Le produit garde l'ambition annuelle mais teste la constance sur un horizon réaliste |
| Écran principal | Écran du jour | C'est le seul écran que l'utilisateur doit ouvrir quotidiennement |
| Volume quotidien | 3 à 6 actions maximum | Au-delà, l'app devient une charge mentale |
| Humeur | Valeur simple de 1 à 5 | Suffisant pour relire la dynamique sans psychologiser |
| Note | Facultative, courte | Capturer le contexte sans forcer l'écriture |
| Partage | Export local d'abord, partage natif ensuite | Telegram/Gmail/notes passent par le menu Android sans API externe |

## 3. Parcours utilisateur

### Après le bilan gelé

L'écran "Bilan terminé" ne doit plus être une fin. Il propose de construire le plan d'action.

L'utilisateur renseigne :

- une ambition annuelle en une phrase ;
- un à trois objectifs ;
- pour chaque objectif, quelques actions concrètes.

Chaque action est formulée comme quelque chose que l'on peut cocher. Exemple : "Marcher 30 minutes", "Écrire 10 lignes", "Envoyer une candidature", "Lire 5 pages".

### Création des 8 premières semaines

Le plan reste un plan 12 mois dans la base, mais cette tranche matérialise seulement les 8 premières semaines. L'utilisateur choisit pour chaque action :

- les jours prévus, par exemple lundi/mercredi/vendredi ;
- ou une semaine précise, pour une action ponctuelle.

L'application génère alors les occurrences quotidiennes pour les 8 semaines à venir. Les dates sont des dates civiles locales au format `AAAA-MM-JJ`.

### Écran du jour

Au lancement, si un plan actif existe, l'application affiche l'écran du jour.

Cet écran contient :

- la date du jour ;
- les actions prévues aujourd'hui ;
- une limite visible si plus de 6 actions existent, avec priorité aux premières dans l'ordre du plan ;
- un choix d'humeur de 1 à 5 ;
- une note facultative ;
- un bouton "Clôturer ma journée".

Cocher une action enregistre immédiatement son statut. Clôturer la journée écrit une ligne dans `journal_jours` avec l'humeur, la note et la date de clôture.

### Après clôture

Une journée clôturée reste consultable mais ne met pas de pression à "rattraper". Si l'utilisateur revient après plusieurs jours, l'application reprend au jour courant. Les jours manqués peuvent être visibles dans le suivi, mais l'interface ne doit pas culpabiliser.

## 4. Modèle de données

La migration v1 contient déjà les tables nécessaires : `plans`, `objectifs`, `jalons`, `actions`, `occurrences`, `journal_jours`.

Cette tranche utilise le schéma existant sans nouvelle table.

### `plans`

- `statut = 'actif'` pour le plan quotidien courant.
- `source = 'manuel'`.
- `debut_le` vaut la date locale de démarrage.
- `fin_le` peut rester à 12 mois après `debut_le`, même si seules 8 semaines sont matérialisées.

### `objectifs`

Chaque objectif appartient au plan actif. `trimestre` vaut `1` dans cette tranche. `ordre` fixe l'ordre d'affichage.

### `actions`

Chaque action appartient au plan actif. Les actions récurrentes utilisent `type = 'recurrente'` et stockent leur règle simple dans `recurrence`.

Format de `recurrence` pour cette tranche :

```json
{"jours":[1,3,5],"pendantSemaines":8}
```

Les jours suivent la convention ISO : lundi `1`, dimanche `7`.

Les actions ponctuelles utilisent `type = 'ponctuelle'` et une `semaine` entre 1 et 8.

### `occurrences`

Une occurrence représente une action prévue à une date locale.

Statuts utilisés dans cette tranche :

- `a_faire` : prévue, pas encore cochée ;
- `fait` : cochée ;
- `manque` : non faite sur une journée clôturée ;
- `reporte` : réservé, non exposé dans la première interface.

La génération est idempotente grâce à l'unicité `(action_id, date_prevue)`.

### `journal_jours`

Une ligne par date clôturée. La série se calcule depuis cette table et ne se stocke pas.

## 5. Règles métier

1. Un seul plan actif à la fois.
2. Un plan ne peut être créé qu'à partir d'un bilan gelé.
3. L'écran du jour affiche au maximum 6 actions.
4. Une journée peut être clôturée même si toutes les actions ne sont pas faites.
5. À la clôture, les actions restantes du jour passent à `manque`.
6. Une journée clôturée peut être rouverte uniquement par une action explicite "Modifier cette journée".
7. La série de constance compte les jours clôturés consécutifs jusqu'à aujourd'hui.
8. Le suivi 8 semaines affiche jours clôturés, actions faites, actions manquées et humeur moyenne.
9. L'export JSON doit inclure toutes les tables du plan et du journal, comme l'export actuel.
10. Aucune donnée ne quitte l'appareil sans une action explicite d'export ou de partage.

## 6. Architecture

La structure actuelle reste la bonne : domaine, dépôts SQL, écrans React.

Nouveaux modules proposés :

| Fichier | Responsabilité |
|---|---|
| `src/domaine/dates.ts` | Dates civiles locales, ajout de jours, numéro de semaine, jour ISO |
| `src/domaine/constance.ts` | Calcul de série et statistiques 8 semaines |
| `src/donnees/depot-plan.ts` | Création du plan, objectifs, actions, génération des occurrences |
| `src/donnees/depot-suivi.ts` | Lecture de la journée, cochage, humeur, note, clôture |
| `src/ui/ecrans/Plan.tsx` | Saisie guidée du plan manuel |
| `src/ui/ecrans/Jour.tsx` | Écran quotidien |
| `src/ui/ecrans/Suivi.tsx` | Vue de constance simple |

`App.tsx` orchestre les étapes :

1. pas de réglages : démarrage ;
2. bilan brouillon : bilan ;
3. bilan gelé sans plan actif : création du plan ;
4. plan actif : écran du jour ;
5. accès secondaire aux réglages et au suivi.

## 7. Interface

L'interface doit rester sobre. Le premier écran utile après création du plan est l'écran du jour, pas un tableau annuel.

Les textes restent en français. Le ton évite la faute morale. On dira plutôt "Aujourd'hui n'est pas clôturé" que "Vous avez échoué".

L'écran du jour doit fonctionner d'une main :

- cases à cocher larges ;
- humeur par boutons 1 à 5 ;
- note courte ;
- bouton de clôture visible sans chercher.

## 8. Export et partage

L'export JSON actuel couvre déjà les tables de données. Il reste le format de sauvegarde principal.

Cette tranche ajoute un résumé textuel partageable :

- ambition ;
- objectifs ;
- constance des 8 semaines ;
- actions faites/manquées ;
- notes de journal si l'utilisateur les inclut explicitement.

Le partage cible le menu natif Android via Capacitor Share dans une tranche suivante. Si le plugin n'est pas installé dans cette tranche, le résumé textuel peut d'abord être copié ou exporté dans le JSON.

## 9. Tests attendus

Les tests automatisés doivent couvrir :

- dates locales sans UTC caché ;
- génération d'occurrences sur 8 semaines ;
- idempotence de la génération ;
- limite de 6 actions affichées ;
- cochage d'une action ;
- clôture avec passage des actions restantes à `manque` ;
- calcul de série ;
- aiguillage `App` vers plan ou jour selon l'état ;
- export contenant plan, occurrences et journal.

Les tests UI doivent vérifier les parcours principaux sans dépendre de Capacitor natif.

## 10. Hors périmètre

Cette tranche ne fait pas :

- génération IA du plan ;
- compte utilisateur ;
- synchronisation cloud ;
- Telegram/Gmail par API directe ;
- notifications locales ;
- édition complète d'un plan annuel ;
- statistiques avancées ;
- partage PDF.

Ces sujets restent compatibles avec l'architecture, mais ils ne sont pas nécessaires pour tester la valeur principale : ouvrir l'app chaque jour et tenir une direction.
