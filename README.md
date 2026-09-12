# Childeric — 12 Month Plan

Un dispositif d'accompagnement personnel en cours de digitalisation : une **fiche bilan** (personnel + professionnel) qui donne une direction, et un **programme sur 12 mois** qui la tient dans le temps.

Le problème que ce projet attaque n'est pas l'introspection — c'est la **constance**. Un tableau de 52 semaines rempli en janvier est mort en février. L'objectif est un outil qui rappelle, mesure et renvoie un miroir.

## État du projet

La v1 locale est implémentée : bilan de bout en bout (53 questions), gel du bilan, plan manuel, écran du jour, suivi de constance, export et suppression des données. Le détail de ce qui a été vérifié est ici : [`VERIFICATION-v0.1.md`](VERIFICATION-v0.1.md).

La génération automatique du plan sur 12 mois arrive dans une prochaine version.

La spécification de la v1 est ici : [`docs/superpowers/specs/2026-09-10-childeric-design.md`](docs/superpowers/specs/2026-09-10-childeric-design.md)

## La v1 en bref

Une application Android autonome (APK), installable directement, sans serveur.

| | |
|---|---|
| Technologie | Capacitor + React + TypeScript |
| Stockage | SQLite sur l'appareil — rien ne part en ligne |
| Rappels | Notifications locales Android |
| Structure du plan | Ambition → objectifs → jalons → actions |
| Génération du plan | Appel unique à l'API Claude depuis l'appareil, avec la clé de l'utilisateur |

Le geste quotidien vise **30 secondes** : trois à six lignes à cocher, une humeur, une note facultative.

## Routine offline

Après le bilan gelé, Childeric permet de créer un plan manuel, de générer les 8 premières semaines d'actions, puis de suivre chaque journée avec actions à cocher, humeur, note et clôture. Cette boucle reste 100% locale.

## Confidentialité

La fiche bilan récolte des réponses intimes. Deux règles :

- **Les bilans remplis ne sont jamais commités.** Le `.gitignore` les exclut ; ce dépôt est public.
- Dans l'application, les données restent sur l'appareil. La seule sortie réseau est la génération du plan, soumise à un consentement explicite qui montre ce qui est transmis.

## Contenu du dépôt

| Chemin | Rôle |
|---|---|
| `FICHE BILAN.docx` | Le gabarit vierge : 11 questions personnelles, 20 professionnelles |
| `docs/superpowers/specs/` | Les spécifications de conception |
| `src/` | Le code source de l'application (domaine, données, interface) |
| `tests/` | La suite de tests automatisés |
| `android/` | Le projet Android natif (Capacitor) qui produit l'APK |
| `VERIFICATION-v0.1.md` | La procédure de vérification manuelle de la v0.1 et ses limites connues |
