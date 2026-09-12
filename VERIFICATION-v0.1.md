# Vérification de Childeric v0.1

Cette version vous permet de remplir votre bilan personnel et professionnel de bout en bout, de le geler une fois terminé, puis d'exporter ou de supprimer vos données.

## Installer l'APK

Avec un câble et le téléphone en mode débogage USB, depuis Git Bash à la racine du projet (cette commande utilise une syntaxe bash et ne fonctionnera pas telle quelle dans PowerShell ou l'invite de commandes Windows) :

```
"$LOCALAPPDATA/Android/Sdk/platform-tools/adb" install -r android/app/build/outputs/apk/debug/app-debug.apk
```

Sans câble : copiez le fichier `android/app/build/outputs/apk/debug/app-debug.apk` sur votre téléphone (par exemple par une clé USB, un partage de fichier ou une messagerie), puis ouvrez-le directement depuis le téléphone. Android vous demandera d'autoriser l'installation depuis des sources inconnues pour l'application utilisée (gestionnaire de fichiers, messagerie…) : acceptez cette autorisation le temps de l'installation.

## Liste de vérification, à dérouler sur votre téléphone

1. Premier lancement : l'écran « Bienvenue » s'affiche, et le fuseau horaire détecté est le bon.
2. Saisissez votre prénom et validez : la première question du bilan apparaît.
3. Répondez à trois questions, puis **fermez complètement l'application** (pas seulement mise en arrière-plan) et rouvrez-la : elle doit reprendre directement à la quatrième question.
4. Revenez en arrière d'une question : la réponse que vous aviez donnée s'affiche bien.
5. Continuez jusqu'à la dernière question et appuyez sur « Terminer » : l'écran « Bilan terminé » s'affiche.
6. Rouvrez l'application : elle doit afficher directement « Bilan terminé » (votre bilan est désormais figé et ne peut plus être modifié).
7. Dans Réglages, appuyez sur « Exporter mes données » : un fichier JSON est produit et contient bien vos réponses. Le bouton « Retour » en bas de l'écran vous ramène à l'écran « Bilan terminé ».
8. Toujours dans Réglages, demandez la suppression et confirmez : vos données disparaissent. Le bouton « Retour » en bas de l'écran vous ramène à l'écran « Bilan terminé ».

## Ce que cette version ne fait pas encore

- La construction automatique de votre plan sur 12 mois à partir de vos réponses.
- Les rappels associés.

Ces fonctions arrivent dans les versions suivantes.

## Vérification routine offline

1. Terminer ou conserver un bilan gelé.
2. Depuis l'écran de plan, saisir une ambition, un objectif, une action et au moins un jour.
3. Créer le plan : l'écran « Aujourd'hui » apparaît.
4. Cocher une action, choisir une humeur, saisir une note.
5. Clôturer la journée : l'action restante éventuelle passe à manquée.
6. Ouvrir le suivi : la série, les jours clôturés et les actions se mettent à jour.
7. Exporter les données : le JSON contient plans, objectifs, actions, occurrences et journal.

## Limites connues de cette version

- L'export écrit le fichier dans le dossier Documents de votre téléphone. Sur Android 7 à 10, cette écriture peut échouer faute des autorisations de stockage que ces versions exigent. Si l'export échoue, l'application vous le dit explicitement : dans ce cas, ne supprimez rien tant que l'export n'a pas réussi.
- Le fichier exporté n'est pas chiffré : il contient vos réponses en clair et reste lisible par les autres applications de votre téléphone. Il est donc recommandé de le déplacer vers un endroit sûr (ou de le supprimer) une fois que vous l'avez mis en sécurité.
