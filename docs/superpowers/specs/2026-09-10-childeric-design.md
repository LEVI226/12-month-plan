# Childeric — Spécification de conception

**Date :** 2026-09-10
**Statut :** validée, prête pour le plan d'implémentation
**Périmètre de ce document :** la v1, une application Android autonome (APK)

---

## 1. Contexte

Le dispositif Childeric existe aujourd'hui sous forme de trois documents bureautiques :

| Fichier | Rôle |
|---|---|
| `FICHE BILAN.docx` | Gabarit vierge : bilan personnel (11 questions) + bilan professionnel (20 questions) |
| `FICHE BILANYannick.odt` | Le gabarit rempli par un utilisateur réel |
| `12 Months ProgramYanick.ODT` | Tableau de planification annuelle : 52 semaines, 4 activités principales par semaine |

La logique du dispositif est un entonnoir : le bilan produit une **direction** (qui je suis, ma passion, mon métier de rêve, mon plan de carrière), le programme 12 mois produit l'**exécution** qui la tient dans le temps.

Le document papier échoue sur l'exécution. Un tableau de 52 semaines rempli en janvier est mort en février : rien ne rappelle, rien ne mesure, rien ne renvoie de miroir. L'exemplaire rempli le confirme — le bilan est complet, le programme est vide.

## 2. Le problème que le produit résout

**Le cœur de valeur est la tenue dans la durée, pas l'introspection.** Le bilan est l'amont qui donne du sens ; le produit lui-même est un moteur de constance. Toute décision de conception qui oppose « profondeur du bilan » à « facilité du geste quotidien » se tranche en faveur du geste quotidien.

**Critère de succès de la v1 :** l'utilisateur ouvre l'application et clôture sa journée **au moins 5 jours sur 7 pendant 8 semaines consécutives**, sans qu'on le lui rappelle autrement que par l'application.

## 3. Décisions structurantes

| Décision | Choix | Raison |
|---|---|---|
| Forme de la v1 | APK Android autonome, installable directement | Tester sur soi avant de construire du public ; zéro coût récurrent |
| Technologie | Capacitor + React + TypeScript | Une seule base de code, réutilisable telle quelle pour le SaaS v2 |
| Stockage | SQLite sur l'appareil | Hors-ligne total, aucune donnée ne quitte le téléphone |
| Rappels | Notifications locales programmées par Android | Aucun serveur, aucun bot, aucun coût |
| Structure du plan | Ambition → objectifs → jalons → actions | Le bilan doit produire quelque chose de structuré, pas une liste plate |
| Remplissage du plan | Généré par IA depuis le bilan, appel direct depuis l'app | Un plan à 4 niveaux saisi à la main ne se remplit jamais |
| Clé API | Saisie par l'utilisateur, stockée dans le trousseau Android | Pas de secret embarqué dans l'APK, pas de backend à tenir |
| Comptes / synchronisation | **Hors périmètre v1** | Un seul utilisateur, un seul téléphone |

### Reporté à la v2 (SaaS)

Comptes et authentification, synchronisation multi-appareils, canaux de rappel sortants (Telegram, e-mail, WhatsApp), accompagnement par un coach, partage et export public. Le modèle de données de la v1 est conçu pour absorber ces ajouts sans réécriture — voir § 12.

## 4. Architecture

Une application React empaquetée par Capacitor. Aucun serveur. Sept modules, chacun avec une raison d'être unique et une frontière explicite.

| Module | Ce qu'il fait | Dépend de |
|---|---|---|
| `parametres` | Fuseau horaire, heure de rappel, clé API, consentements | — |
| `bilan` | Catalogue des 31 questions, réponses, progression, gel | `parametres` |
| `ia` | Unique porte de sortie vers le modèle : prompt, appel, validation, journal | `parametres` |
| `plan` | Hiérarchie ambition/objectifs/jalons/actions, versions, révisions, **assistant de saisie manuelle** | `bilan`, `ia` |
| `suivi` | Journal quotidien, cochage, séries, clôture de semaine | `plan` |
| `rappels` | Programme et annule les notifications locales | `suivi`, `parametres` |
| `restitution` | Tableau de bord, bilan hebdomadaire, export JSON | `suivi`, `bilan` |

Deux frontières à défendre :

**`ia` est isolé.** Aucun autre module n'appelle le modèle. Il expose une seule fonction — `genererPlan(bilanGele) → PlanBrouillon` — au type de sortie strict. Changement de fournisseur, mode dégradé, panne réseau : tout est confiné là.

**`rappels` ne connaît pas le contenu.** Il reçoit des intentions (« relancer à 20h locale si la journée n'est pas clôturée ») et parle uniquement au planificateur de notifications d'Android. En v2, la même interface recevra une implémentation serveur sans que le reste bouge.

**Flux central :** bilan gelé → `ia` → plan brouillon → **édition et validation par l'utilisateur** → plan actif → `suivi` dérive chaque jour une liste courte → `rappels` programme la notification du soir → `restitution` renvoie le miroir le dimanche.

**Règle d'écran :** la hiérarchie à quatre niveaux vit dans `plan` et **n'apparaît jamais sur l'écran du jour**. `suivi` n'expose que les actions de la semaine en cours et les engagements récurrents. C'est ce qui garde le geste quotidien à 30 secondes malgré la profondeur du modèle.

## 5. Modèle de données (SQLite)

```
parametres         cle · valeur                      ⟨fuseau, heure_rappel, consentements⟩
questions          code · section · ordre · intitule · aide · type · obligatoire
                   · version_catalogue                          ⟨livré avec l'APK⟩
bilans             id · statut(brouillon|gele) · version_catalogue · cree_le · gele_le
reponses           bilan_id · question_code · valeur · maj_le   ⟨unique par couple⟩
plans              id · bilan_id · ambition · statut(brouillon|actif|archive)
                   · debut_le · fin_le · source(ia|manuel) · version
objectifs          plan_id · titre · description · trimestre(1-4) · ordre
jalons             objectif_id · titre · mois(1-12) · echeance · statut
actions            plan_id · jalon_id(nullable) · titre
                   · type(ponctuelle|recurrente) · semaine(1-52) · recurrence · ordre
occurrences        action_id · date_prevue · statut(a_faire|fait|manque|reporte)
                   · fait_le · note
journal_jours      date · humeur · note · cloture_le
notifications      date · motif · programmee_le · declenchee_le  ⟨unique date+motif⟩
generations_ia     bilan_id · modele · jetons_entree · jetons_sortie
                   · cout_estime · statut · cree_le
```

**Règle 1 — le bilan se gèle.** À la fin du bilan, `statut` passe à `gele` et l'écriture dans les `reponses` rattachées est interdite. Le plan référence un instantané stable, la génération est reproductible, et le bilan de l'année suivante est simplement une nouvelle ligne — ce qui donne la comparaison N/N+1 sans travail supplémentaire.

**Règle 2 — une ligne par action et par jour.** `occurrences` matérialise le geste quotidien. Elle est générée **semaine par semaine**, jamais 366 jours d'avance : un plan révisé ne laisse pas de résidus.

**Règle 3 — la série se calcule, ne se stocke pas.** Aucun compteur maintenu à la main. La série se déduit de `journal_jours` par requête.

**Règle 4 — les dates sont civiles et locales.** `occurrences.date_prevue` et `journal_jours.date` sont des dates locales, pas des horodatages UTC convertis à l'affichage. « Le point du jour » et « la série » n'ont de sens qu'en heure locale. C'est le bug numéro un de ce type de produit.

**Garde-fous de volume**, imposés à la génération et vérifiés en base : 3 objectifs par plan, 3 jalons par objectif, 5 actions par semaine au maximum.

## 6. Parcours utilisateur

**Premier lancement.** Trois questions : prénom, fuseau horaire (pré-rempli par l'appareil), heure du point quotidien. Pas de compte, pas de mot de passe, pas d'e-mail.

**Le bilan.** Une question par écran, jamais un mur de champs. Sauvegarde à chaque frappe, reprise exacte au point d'arrêt — le bilan se fait en trois fois, c'est le cas normal. Barre de progression par fiche. Durée visée : 25 à 35 minutes cumulées.

**Le gel et le consentement.** Écran dédié avant la génération. Il ne demande pas d'accepter des conditions : il **montre** la liste exacte des réponses transmises, le fournisseur, l'engagement de non-entraînement, et propose un bouton « construire mon plan sans transmettre » qui bascule sur la saisie manuelle assistée.

**La génération.** 30 à 60 secondes, occupées par ce qui se construit. Sortie : un plan **brouillon**, jamais actif d'emblée.

**L'appropriation.** Écran de validation : les 3 objectifs, leurs jalons, les premières actions. Tout est éditable — renommer, supprimer, ajouter, redécouper. Un plan qu'on n'a pas touché est un plan qu'on n'exécute pas. La validation fixe la date de début et rend le plan actif.

**L'écran du jour** — le seul écran qui compte. Trois à six lignes : les actions de la semaine en cours et les engagements récurrents du jour. On coche. Une humeur en un geste, une note d'une phrase si l'envie vient. Un bouton « clôturer ma journée ». **Cible : 30 secondes, sans réflexion.**

**Le dimanche.** Clôture hebdomadaire : ce qui a été tenu, ce qui a glissé, et le choix des actions de la semaine suivante. C'est ce moment qui empêche le plan de redevenir un document mort.

**Chaque trimestre.** Relecture des objectifs face au bilan gelé. Le plan est versionné, l'ancienne version archivée.

## 7. Rappels locaux

Aucune tâche serveur. L'application programme des notifications Android à l'avance, et les reprogramme à chaque clôture de journée et à chaque redémarrage de l'appareil.

| Motif | Quand | Ton |
|---|---|---|
| Point du jour manquant | Heure choisie, en local | Court, factuel |
| Clôture de la semaine | Dimanche, 18h locale | Invitation au bilan |
| Jalon à échéance | 3 jours avant | Rappel d'enjeu |
| Retour après absence | Après 3 jours de silence | **Sans culpabilisation** |

**Le ton du dernier motif n'est pas cosmétique.** La honte est ce qui fait désinstaller ce type d'application. Le message de reprise propose de reprendre où on en est, jamais de rattraper le retard.

**Idempotence.** Unicité sur `notifications(date, motif)`. Une reprogrammation après redémarrage ne produit jamais de doublon.

**Plafond strict.** Au maximum une notification quotidienne et une hebdomadaire. Après 14 jours d'inactivité totale : une seule notification de reprise, puis **silence** jusqu'au retour de la personne.

**Contrainte Android à traiter explicitement :** les notifications programmées à l'heure exacte demandent une autorisation dédiée sur les versions récentes, et l'optimisation de batterie de certains constructeurs les retarde. L'application demande l'autorisation au bon moment (après la validation du plan, pas au premier lancement) et détecte le cas où les rappels sont bridés pour l'expliquer à l'utilisateur.

## 8. Génération du plan

**Modèle : `claude-opus-5`**, réflexion adaptative, effort `high`, en streaming, appelé directement depuis l'application via le client HTTP natif de Capacitor. C'est un appel **unique par utilisateur et par an** : celui qui détermine la qualité de toute l'année. Économiser ici serait une fausse économie.

**Coût.** Environ 4 000 à 6 000 jetons en entrée, 6 000 à 10 000 en sortie. Aux tarifs Opus 5 ($5 / $25 par million), cela donne **0,20 à 0,25 $ par génération, soit environ 130 à 150 FCFA**, une seule fois.

**Sortie structurée.** Le schéma objectifs/jalons/actions est déclaré via `output_config.format` et **revalidé par Zod** avant toute écriture en base. Aucun rattrapage de JSON approximatif par expression régulière : un plan hors gabarit est rejeté.

**Garde-fous du prompt :** 3 objectifs, 3 jalons, 5 actions hebdomadaires maximum ; actions formulées de façon **vérifiable** (« publier un article » et non « progresser en écriture ») ; français ; ancrage dans le contexte réel décrit par le bilan. Une seule reprise automatique en cas de violation du gabarit, puis bascule sur la saisie manuelle assistée. Jamais de boucle de réessais.

**Le refus du modèle est un cas nominal.** Les fiches bilan contiennent des réponses intimes — peurs, échecs, sexualité, détresse. Le code vérifie `stop_reason` **avant** de lire le contenu, active le repli côté serveur (`fallbacks: "default"`), et en cas de refus persistant affiche un message digne : « nous n'avons pas pu générer votre plan automatiquement, voici les trames à adapter ». L'utilisateur n'est jamais informé que ses réponses ont été jugées.

**Garde-fou éthique.** L'IA produit un plan d'action, pas un avis psychologique. Si le bilan contient des signaux de détresse, l'application affiche des ressources d'aide et n'en tire aucune injonction de performance. Le prompt l'interdit explicitement.

**Sobriété.** Deux générations maximum par jour. Chaque appel journalisé dans `generations_ia` avec jetons et coût réels, consultable dans les réglages.

## 9. Sécurité et confidentialité

Les données de bilan sont intimes. Trois règles :

1. **Rien ne quitte l'appareil**, à la seule exception de l'appel de génération, soumis à un consentement explicite et daté qui montre exactement ce qui part.
2. **La clé API vit dans le trousseau Android** (stockage adossé au Keystore), jamais dans la base SQLite, jamais dans l'APK, jamais dans un journal.
3. **L'export est un droit, la suppression aussi.** Export JSON complet vers un fichier local ; suppression totale des données depuis les réglages, sans confirmation par e-mail ni délai.

**Cet APK n'est pas destiné à être redistribué tel quel.** Il est construit pour être installé par la personne qui possède sa propre clé API. La diffusion à d'autres utilisateurs relève de la v2 et impose un intermédiaire serveur.

## 10. Gestion des erreurs

| Panne | Réponse |
|---|---|
| Génération échouée, refusée ou hors gabarit | Bilan intact, saisie manuelle assistée proposée, aucune perte |
| Pas de réseau au moment de générer | Message explicite, bilan conservé, reprise possible plus tard |
| Clé API absente ou invalide | Détectée avant l'appel, renvoi vers les réglages |
| Notification bridée par le système | Détection et explication à l'utilisateur, avec le chemin de réglage |
| Redémarrage de l'appareil | Reprogrammation des notifications au démarrage |
| Base corrompue ou migration ratée | Migrations versionnées et testées ; sauvegarde JSON avant migration |

## 11. Stratégie de test

Développement piloté par les tests : d'abord un test qui échoue, ensuite le code.

- **Unitaires (Vitest)** sur ce qui est subtil et invisible : calcul des séries, bascules de dates en fuseau local, génération des occurrences d'une semaine, idempotence des notifications, migrations SQLite. C'est là que vivent les vrais bugs.
- **Contrat IA** : réponses de modèle **enregistrées en fixtures**, rejouées à chaque exécution de la suite de tests. Aucun appel facturé dans les tests. Le jeu de fixtures couvre le cas nominal, le hors-gabarit, et le refus.
- **Bout en bout** sur un seul chemin, le chemin vital : premier lancement → bilan → génération (simulée) → validation → cocher le premier jour → série à 1.

## 12. Chemin vers la v2 (SaaS)

La v1 est conçue pour être promue, pas jetée. Ce qui rend la migration possible :

- **Même schéma.** Les tables passent de SQLite à Postgres en ajoutant une colonne `profil_id` et les politiques d'accès par ligne correspondantes.
- **Même base de code.** L'application React devient la PWA ; Capacitor reste pour l'APK. Aucune réécriture d'interface.
- **Accès aux données derrière une interface.** Chaque module parle à un `Depot` (`DepotBilan`, `DepotPlan`, `DepotSuivi`). L'implémentation SQLite est remplacée par une implémentation serveur. **C'est la contrainte d'architecture la plus importante de la v1** — sans elle, la v2 est une réécriture.
- **`ia` déplacé côté serveur.** Même fonction, même schéma de sortie ; seul l'endroit de l'appel change, et la clé API cesse d'être celle de l'utilisateur.
- **Import de l'export JSON**, pour que les données de la v1 remontent dans le compte v2.

## 13. Hors périmètre explicite de la v1

Comptes, synchronisation, partage, coach, Telegram, e-mail, WhatsApp, export PDF, statistiques avancées, iOS, publication sur le Play Store, internationalisation. Chacun de ces éléments est une raison de ne pas livrer ; aucun n'est nécessaire pour valider le critère de succès du § 2.
