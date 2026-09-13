# Finalisation de Childeric

La version Expo d'Emergent sur `main` est la base produit et visuelle retenue.
L'application fonctionne sans connexion pour le bilan, le plan et le suivi.
Les fonctions en ligne sont autorisees : generation IA facultative et partage
declenche par l'utilisateur. Aucune promesse de fonctionnement exclusivement offline.

## Perimetre accepte

- Conserver les ecrans, images, polices et interactions d'Emergent.
- Fiabiliser les sauvegardes, la restauration et la suppression.
- Confirmer le gel du bilan, conserver les bilans precedents, enrichir l'export.
- Completer les suggestions locales et proposer un plan IA editable avec consentement.
- Proteger la cle API avec SecureStore, jamais dans un export.
- Verifier les rappels locaux, cycles de huit semaines et reprise apres absence.
- Tester la logique et les parcours ; documenter les limites des essais sur appareil.

## Base verifiee

Sources originales recuperees depuis `origin/main`, commit
`a96f1df6b21ace81b7eee7ef6a10ea7de28d1053`.
Travail isole sur `codex/finaliser-emergent`.
Le depot `LEVI226/childeric-expo` indique dans les anciens messages est inaccessible.
La destination existante est `LEVI226/12-month-plan`.

## Verification attendue

Installation reproductible, tests automatises, verification TypeScript, export web,
puis parcours sur telephone pour les notifications et le partage natif.
Un test fournisseur reel exige une cle utilisateur ; aucune cle ne doit etre ajoutee
au depot ou aux journaux.

## Executer

Depuis `frontend` : `npm install`, `npm test`, `npm run typecheck`, puis
`npm start -- --port 8092`. Scanner le QR avec Expo Go sur le meme Wi-Fi.
Le navigateur sert a verifier les ecrans ; la cle API est configuree uniquement
sur mobile car SecureStore n'existe pas dans le navigateur.

## Modeles et sources

Valeurs de depart modifiables, verifiees le 13 septembre 2026 :

- Claude : https://platform.claude.com/docs/en/models/overview
- OpenAI : https://developers.openai.com/api/docs/models/gpt-5.4-mini
- DeepSeek : https://api-docs.deepseek.com/api/list-models
- Kimi : https://platform.kimi.ai/docs/guide/kimi-k2-6-quickstart

Le test de connexion n'envoie aucun bilan. La generation transmet uniquement les
questions repondues affichees dans le consentement. Les erreurs HTTP sont rendues
avec leur code et un message francais, sans afficher de corps brut susceptible
de contenir une cle. Aucune generation fournisseur reelle n'a ete effectuee durant
la verification, faute de cle utilisateur.

## Etat des verifications

- 29 tests automatises : persistance, store, dates, occurrences, suggestions, badges, IA.
- Verification TypeScript et export web reussis.
- Notifications, partage natif et SecureStore a verifier sur telephone.
- L'installation signale 15 vulnerabilites moderees ; pas de mise a jour majeure
  automatique des dependances Expo.
