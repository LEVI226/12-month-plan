# Childeric v1 — Plan d'implémentation : socle et bilan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produire un APK Android installable sur lequel l'utilisateur peut faire son bilan personnel et professionnel de bout en bout, le geler, et exporter ou supprimer ses données.

**Architecture:** Application React + TypeScript compilée par Vite, empaquetée en APK par Capacitor. Toutes les données vivent dans une base SQLite sur l'appareil. Chaque module du domaine parle à un **dépôt** (interface) et jamais directement à SQL : c'est ce qui permettra de remplacer le stockage local par un serveur en v2 sans réécrire l'application. Les migrations de schéma sont versionnées et testées.

**Tech Stack:** Vite 8, React 19, TypeScript, Capacitor 8, `@capacitor-community/sqlite` 8, Vitest 5 + jsdom + Testing Library, `node:sqlite` (intégré à Node 22) pour tester le SQL réel sans compilation native.

**Spec:** [`docs/superpowers/specs/2026-09-10-childeric-design.md`](../specs/2026-09-10-childeric-design.md)

## Global Constraints

Ces règles s'appliquent à **toutes** les tâches de ce plan.

- **Français partout** : noms de modules, de fichiers, de tables, de colonnes, de fonctions, de variables, et textes d'interface. Le vocabulaire du dispositif est français ; le code le reste.
- **Aucun accès SQL hors de `src/donnees/`.** Les modules du domaine et l'interface passent exclusivement par les dépôts. C'est la contrainte d'architecture la plus importante de la v1 : sans elle, la v2 est une réécriture (spec § 12).
- **Les dates sont civiles et locales**, au format `AAAA-MM-JJ`, jamais des horodatages UTC convertis à l'affichage (spec § 5, règle 4).
- **Un bilan gelé est immuable.** Toute écriture dans ses réponses doit échouer (spec § 5, règle 1).
- **Rien ne sort de l'appareil dans ce plan.** Aucun appel réseau n'est écrit ici.
- **TDD strict** : le test d'abord, on le regarde échouer, puis l'implémentation minimale. Pas de code écrit avant son test.
- **JDK 21 obligatoire pour compiler l'APK.** Le `java` du PATH est en 17 et ne suffit pas. Toutes les commandes Gradle sont précédées de :
  `export JAVA_HOME="/c/Program Files/Android/Android Studio/jbr"`
- **Identifiant d'application :** `bf.childeric.app`. **Nom :** `Childeric`.

## Structure des fichiers

| Fichier | Responsabilité |
|---|---|
| `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html` | Socle de compilation et de test |
| `capacitor.config.ts` | Identité de l'application, dossier web, plugins |
| `src/main.tsx` | Point d'entrée React |
| `src/ui/App.tsx` | Aiguillage entre écrans |
| `src/ui/ecrans/Demarrage.tsx` | Premier lancement : prénom, fuseau, heure de rappel |
| `src/ui/ecrans/Bilan.tsx` | Le bilan, une question par écran |
| `src/ui/ecrans/Reglages.tsx` | Export, suppression, informations |
| `src/donnees/pilote.ts` | Interface `PiloteSql` — la seule porte vers SQL |
| `src/donnees/pilote-capacitor.ts` | Implémentation appareil (SQLite natif) |
| `src/donnees/pilote-node.ts` | Implémentation de test (`node:sqlite`) |
| `src/donnees/migrations.ts` | Liste ordonnée des migrations de schéma |
| `src/donnees/migrer.ts` | Applique les migrations manquantes |
| `src/donnees/depot-parametres.ts` | Lecture/écriture des réglages |
| `src/donnees/depot-bilan.ts` | Création, réponses, reprise, gel |
| `src/donnees/export.ts` | Export JSON et suppression totale |
| `src/domaine/types.ts` | Types partagés |
| `src/domaine/questions.ts` | Catalogue des questions du bilan |
| `tests/**` | Les tests, en miroir de `src/` |

---

### Task 1: Socle du projet et premier APK

Une application vide mais réelle : elle compile, elle est testée, et elle s'installe sur le téléphone. Tant que l'APK n'est pas sorti une fois, tout le reste est de la spéculation.

**Files:**
- Create: `package.json`, `tsconfig.json`, `tsconfig.node.json`, `vite.config.ts`, `index.html`, `capacitor.config.ts`, `src/main.tsx`, `src/ui/App.tsx`, `tests/ui/App.test.tsx`, `tests/preparation.ts`

**Interfaces:**
- Consumes: rien
- Produces: `App(): JSX.Element` — composant racine ; scripts npm `dev`, `build`, `test`

- [ ] **Step 1: Créer le socle de compilation**

`package.json` :

```json
{
  "name": "childeric",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

`index.html` :

```html
<!doctype html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <title>Childeric</title>
  </head>
  <body>
    <div id="racine"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

`tsconfig.json` :

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true,
    "types": ["vitest/globals"]
  },
  "include": ["src", "tests"]
}
```

`vite.config.ts` :

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: { outDir: 'dist' },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/preparation.ts'],
  },
});
```

`tests/preparation.ts` :

```ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 2: Installer les dépendances**

```bash
npm install react react-dom
npm install -D typescript vite @vitejs/plugin-react vitest jsdom \
  @testing-library/react @testing-library/dom @testing-library/jest-dom \
  @types/react @types/react-dom
```

- [ ] **Step 3: Écrire le test qui échoue**

`tests/ui/App.test.tsx` :

```tsx
import { render, screen } from '@testing-library/react';
import { App } from '../../src/ui/App';

test("affiche le nom de l'application", () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: 'Childeric' })).toBeInTheDocument();
});
```

- [ ] **Step 4: Lancer le test et vérifier qu'il échoue**

Commande : `npm test`
Attendu : ÉCHEC — `Failed to resolve import "../../src/ui/App"`

- [ ] **Step 5: Écrire l'implémentation minimale**

`src/ui/App.tsx` :

```tsx
export function App() {
  return (
    <main>
      <h1>Childeric</h1>
    </main>
  );
}
```

`src/main.tsx` :

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './ui/App';

createRoot(document.getElementById('racine')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

- [ ] **Step 6: Lancer le test et vérifier qu'il passe**

Commande : `npm test`
Attendu : SUCCÈS — 1 test passé

- [ ] **Step 7: Ajouter Capacitor et la plateforme Android**

```bash
npm install @capacitor/core
npm install -D @capacitor/cli
npx cap init Childeric bf.childeric.app --web-dir dist
npm install @capacitor/android
npm run build
npx cap add android
```

Remplacer ensuite `capacitor.config.ts` par :

```ts
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'bf.childeric.app',
  appName: 'Childeric',
  webDir: 'dist',
  android: { allowMixedContent: false },
};

export default config;
```

- [ ] **Step 8: Compiler l'APK**

```bash
export JAVA_HOME="/c/Program Files/Android/Android Studio/jbr"
npm run build && npx cap sync android
cd android && ./gradlew assembleDebug && cd ..
ls -lh android/app/build/outputs/apk/debug/app-debug.apk
```

Attendu : `BUILD SUCCESSFUL` et un fichier APK d'environ 4 à 8 Mo.

- [ ] **Step 9: Installer sur le téléphone et vérifier**

Téléphone en mode développeur, débogage USB activé, branché :

```bash
"$LOCALAPPDATA/Android/Sdk/platform-tools/adb" devices
"$LOCALAPPDATA/Android/Sdk/platform-tools/adb" install -r \
  android/app/build/outputs/apk/debug/app-debug.apk
```

Si `adb` est absent, installer « Android SDK Platform-Tools » depuis le gestionnaire de SDK d'Android Studio. À défaut, copier l'APK sur le téléphone et l'installer manuellement (autoriser les sources inconnues).

Attendu : l'application `Childeric` apparaît dans le tiroir d'applications, s'ouvre, et affiche « Childeric ».

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: socle Vite/React/Capacitor et premier APK Android"
```

---

### Task 2: Couche de données SQLite et migrations

**Files:**
- Create: `src/donnees/pilote.ts`, `src/donnees/pilote-node.ts`, `src/donnees/migrations.ts`, `src/donnees/migrer.ts`
- Test: `tests/donnees/migrer.test.ts`

**Interfaces:**
- Consumes: rien
- Produces:
  - `interface PiloteSql { executer(sql: string, params?: unknown[]): Promise<void>; lire<T>(sql: string, params?: unknown[]): Promise<T[]>; }`
  - `class PiloteNode implements PiloteSql { constructor(chemin?: string) }` — usage tests uniquement
  - `migrer(pilote: PiloteSql): Promise<number>` — renvoie la version de schéma atteinte
  - `MIGRATIONS: { version: number; sql: string }[]`

- [ ] **Step 1: Écrire le test qui échoue**

`tests/donnees/migrer.test.ts` :

```ts
import { PiloteNode } from '../../src/donnees/pilote-node';
import { migrer } from '../../src/donnees/migrer';

async function baseNeuve() {
  const pilote = new PiloteNode();
  await migrer(pilote);
  return pilote;
}

test('crée toutes les tables du schéma v1', async () => {
  const pilote = await baseNeuve();
  const tables = await pilote.lire<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type='table'",
  );
  const noms = tables.map((t) => t.name);
  for (const attendue of [
    'parametres', 'bilans', 'reponses', 'plans', 'objectifs',
    'jalons', 'actions', 'occurrences', 'journal_jours',
    'notifications', 'generations_ia',
  ]) {
    expect(noms).toContain(attendue);
  }
});

test('migrer deux fois ne casse rien et reste à la même version', async () => {
  const pilote = await baseNeuve();
  const version = await migrer(pilote);
  expect(version).toBe(1);
});

test('une réponse ne peut pas être enregistrée deux fois pour la même question', async () => {
  const pilote = await baseNeuve();
  await pilote.executer("INSERT INTO bilans (id, statut, version_catalogue, cree_le) VALUES ('b1', 'brouillon', 1, '2026-09-10')");
  await pilote.executer("INSERT INTO reponses (bilan_id, question_code, valeur, maj_le) VALUES ('b1', 'p1_identite', 'x', '2026-09-10')");
  await expect(
    pilote.executer("INSERT INTO reponses (bilan_id, question_code, valeur, maj_le) VALUES ('b1', 'p1_identite', 'y', '2026-09-10')"),
  ).rejects.toThrow();
});
```

- [ ] **Step 2: Lancer le test et vérifier qu'il échoue**

Commande : `npm test -- tests/donnees/migrer.test.ts`
Attendu : ÉCHEC — modules `pilote-node` et `migrer` introuvables

- [ ] **Step 3: Écrire l'interface et le pilote de test**

`src/donnees/pilote.ts` :

```ts
export interface PiloteSql {
  executer(sql: string, params?: unknown[]): Promise<void>;
  lire<T>(sql: string, params?: unknown[]): Promise<T[]>;
}
```

`src/donnees/pilote-node.ts` :

```ts
import { DatabaseSync } from 'node:sqlite';
import type { PiloteSql } from './pilote';

/** Pilote destiné aux tests. N'est jamais embarqué dans l'APK. */
export class PiloteNode implements PiloteSql {
  private readonly base: DatabaseSync;

  constructor(chemin = ':memory:') {
    this.base = new DatabaseSync(chemin);
    this.base.exec('PRAGMA foreign_keys = ON');
  }

  async executer(sql: string, params: unknown[] = []): Promise<void> {
    if (params.length === 0) this.base.exec(sql);
    else this.base.prepare(sql).run(...(params as never[]));
  }

  async lire<T>(sql: string, params: unknown[] = []): Promise<T[]> {
    return this.base.prepare(sql).all(...(params as never[])) as T[];
  }
}
```

- [ ] **Step 4: Écrire le schéma v1**

`src/donnees/migrations.ts` :

```ts
export const MIGRATIONS: { version: number; sql: string }[] = [
  {
    version: 1,
    sql: `
      CREATE TABLE parametres (
        cle TEXT PRIMARY KEY,
        valeur TEXT NOT NULL
      );

      CREATE TABLE bilans (
        id TEXT PRIMARY KEY,
        statut TEXT NOT NULL CHECK (statut IN ('brouillon','gele')),
        version_catalogue INTEGER NOT NULL,
        cree_le TEXT NOT NULL,
        gele_le TEXT
      );

      CREATE TABLE reponses (
        bilan_id TEXT NOT NULL REFERENCES bilans(id) ON DELETE CASCADE,
        question_code TEXT NOT NULL,
        valeur TEXT NOT NULL,
        maj_le TEXT NOT NULL,
        PRIMARY KEY (bilan_id, question_code)
      );

      CREATE TABLE plans (
        id TEXT PRIMARY KEY,
        bilan_id TEXT NOT NULL REFERENCES bilans(id) ON DELETE CASCADE,
        ambition TEXT NOT NULL DEFAULT '',
        statut TEXT NOT NULL CHECK (statut IN ('brouillon','actif','archive')),
        debut_le TEXT,
        fin_le TEXT,
        source TEXT NOT NULL CHECK (source IN ('ia','manuel')),
        version INTEGER NOT NULL DEFAULT 1
      );

      CREATE TABLE objectifs (
        id TEXT PRIMARY KEY,
        plan_id TEXT NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
        titre TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        trimestre INTEGER NOT NULL CHECK (trimestre BETWEEN 1 AND 4),
        ordre INTEGER NOT NULL
      );

      CREATE TABLE jalons (
        id TEXT PRIMARY KEY,
        objectif_id TEXT NOT NULL REFERENCES objectifs(id) ON DELETE CASCADE,
        titre TEXT NOT NULL,
        mois INTEGER NOT NULL CHECK (mois BETWEEN 1 AND 12),
        echeance TEXT,
        statut TEXT NOT NULL DEFAULT 'a_faire'
      );

      CREATE TABLE actions (
        id TEXT PRIMARY KEY,
        plan_id TEXT NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
        jalon_id TEXT REFERENCES jalons(id) ON DELETE SET NULL,
        titre TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('ponctuelle','recurrente')),
        semaine INTEGER CHECK (semaine BETWEEN 1 AND 52),
        recurrence TEXT,
        ordre INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE occurrences (
        id TEXT PRIMARY KEY,
        action_id TEXT NOT NULL REFERENCES actions(id) ON DELETE CASCADE,
        date_prevue TEXT NOT NULL,
        statut TEXT NOT NULL CHECK (statut IN ('a_faire','fait','manque','reporte')),
        fait_le TEXT,
        note TEXT,
        UNIQUE (action_id, date_prevue)
      );

      CREATE TABLE journal_jours (
        date TEXT PRIMARY KEY,
        humeur INTEGER,
        note TEXT,
        cloture_le TEXT
      );

      CREATE TABLE notifications (
        date TEXT NOT NULL,
        motif TEXT NOT NULL,
        programmee_le TEXT NOT NULL,
        declenchee_le TEXT,
        PRIMARY KEY (date, motif)
      );

      CREATE TABLE generations_ia (
        id TEXT PRIMARY KEY,
        bilan_id TEXT NOT NULL REFERENCES bilans(id) ON DELETE CASCADE,
        modele TEXT NOT NULL,
        jetons_entree INTEGER NOT NULL DEFAULT 0,
        jetons_sortie INTEGER NOT NULL DEFAULT 0,
        cout_estime REAL NOT NULL DEFAULT 0,
        statut TEXT NOT NULL,
        cree_le TEXT NOT NULL
      );
    `,
  },
];
```

- [ ] **Step 5: Écrire l'application des migrations**

`src/donnees/migrer.ts` :

```ts
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
```

- [ ] **Step 6: Lancer les tests et vérifier qu'ils passent**

Commande : `npm test -- tests/donnees/migrer.test.ts`
Attendu : SUCCÈS — 3 tests passés

- [ ] **Step 7: Commit**

```bash
git add src/donnees tests/donnees
git commit -m "feat(donnees): pilote SQL, schéma v1 et migrations versionnées"
```

---

### Task 3: Pilote SQLite de l'appareil

Le même schéma, mais sur le téléphone. Cette tâche n'est pas testable en Vitest — sa vérification est manuelle, sur l'appareil.

**Files:**
- Create: `src/donnees/pilote-capacitor.ts`, `src/donnees/base.ts`
- Modify: `src/ui/App.tsx`
- Test: `tests/donnees/pilote-capacitor.test.ts`

**Interfaces:**
- Consumes: `PiloteSql`, `migrer`
- Produces:
  - `class PiloteCapacitor implements PiloteSql { static ouvrir(): Promise<PiloteCapacitor> }`
  - `PiloteCapacitor.extraireLignes<T>(resultat: { values?: unknown[] }): T[]`
  - `obtenirBase(): Promise<PiloteSql>` — singleton, migré à la première demande

- [ ] **Step 1: Installer le plugin**

```bash
npm install @capacitor-community/sqlite
npx cap sync android
```

- [ ] **Step 2: Écrire le test qui échoue**

`tests/donnees/pilote-capacitor.test.ts` :

```ts
import { PiloteCapacitor } from '../../src/donnees/pilote-capacitor';

test('convertit un résultat Capacitor en tableau de lignes', () => {
  const lignes = PiloteCapacitor.extraireLignes({ values: [{ a: 1 }, { a: 2 }] });
  expect(lignes).toEqual([{ a: 1 }, { a: 2 }]);
});

test('renvoie un tableau vide quand Capacitor ne renvoie rien', () => {
  expect(PiloteCapacitor.extraireLignes({})).toEqual([]);
});
```

- [ ] **Step 3: Lancer le test et vérifier qu'il échoue**

Commande : `npm test -- tests/donnees/pilote-capacitor.test.ts`
Attendu : ÉCHEC — module introuvable

- [ ] **Step 4: Écrire le pilote de l'appareil**

`src/donnees/pilote-capacitor.ts` :

```ts
import { CapacitorSQLite, SQLiteConnection, type SQLiteDBConnection } from '@capacitor-community/sqlite';
import type { PiloteSql } from './pilote';

const NOM_BASE = 'childeric';

export class PiloteCapacitor implements PiloteSql {
  private constructor(private readonly connexion: SQLiteDBConnection) {}

  static extraireLignes<T>(resultat: { values?: unknown[] }): T[] {
    return (resultat.values ?? []) as T[];
  }

  static async ouvrir(): Promise<PiloteCapacitor> {
    const sqlite = new SQLiteConnection(CapacitorSQLite);
    const connexion = await sqlite.createConnection(NOM_BASE, false, 'no-encryption', 1, false);
    await connexion.open();
    await connexion.execute('PRAGMA foreign_keys = ON');
    return new PiloteCapacitor(connexion);
  }

  async executer(sql: string, params: unknown[] = []): Promise<void> {
    if (params.length === 0) await this.connexion.execute(sql);
    else await this.connexion.run(sql, params);
  }

  async lire<T>(sql: string, params: unknown[] = []): Promise<T[]> {
    const resultat = await this.connexion.query(sql, params);
    return PiloteCapacitor.extraireLignes<T>(resultat);
  }
}
```

`src/donnees/base.ts` :

```ts
import type { PiloteSql } from './pilote';
import { PiloteCapacitor } from './pilote-capacitor';
import { migrer } from './migrer';

let base: PiloteSql | null = null;

export async function obtenirBase(): Promise<PiloteSql> {
  if (base) return base;
  const pilote = await PiloteCapacitor.ouvrir();
  await migrer(pilote);
  base = pilote;
  return base;
}
```

- [ ] **Step 5: Lancer le test et vérifier qu'il passe**

Commande : `npm test -- tests/donnees/pilote-capacitor.test.ts`
Attendu : SUCCÈS — 2 tests passés

- [ ] **Step 6: Vérifier sur l'appareil**

Modifier temporairement `src/ui/App.tsx` pour afficher la version de schéma :

```tsx
import { useEffect, useState } from 'react';
import { obtenirBase } from '../donnees/base';

export function App() {
  const [version, setVersion] = useState<string>('…');

  useEffect(() => {
    obtenirBase()
      .then((base) => base.lire<{ user_version: number }>('PRAGMA user_version'))
      .then(([ligne]) => setVersion(String(ligne.user_version)))
      .catch((erreur) => setVersion(`erreur : ${String(erreur)}`));
  }, []);

  return (
    <main>
      <h1>Childeric</h1>
      <p>Schéma version {version}</p>
    </main>
  );
}
```

```bash
export JAVA_HOME="/c/Program Files/Android/Android Studio/jbr"
npm run build && npx cap sync android
cd android && ./gradlew assembleDebug && cd ..
"$LOCALAPPDATA/Android/Sdk/platform-tools/adb" install -r android/app/build/outputs/apk/debug/app-debug.apk
```

Attendu sur le téléphone : « Schéma version 1 ». Si un message d'erreur s'affiche, lire les journaux avec `adb logcat | grep -i capacitor`.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(donnees): pilote SQLite de l'appareil et ouverture migrée de la base"
```

---

### Task 4: Catalogue des questions du bilan

Le contenu du dispositif, transcrit depuis `FICHE BILAN.docx`. Les 31 questions numérotées du document papier se déploient en écrans successifs : la question 1 du bilan personnel contient à elle seule seize invites, et chacune mérite son écran (spec § 6, « une question par écran »).

**Files:**
- Create: `src/domaine/types.ts`, `src/domaine/questions.ts`
- Test: `tests/domaine/questions.test.ts`

**Interfaces:**
- Consumes: rien
- Produces:
  - `type Section = 'personnel' | 'professionnel'`
  - `type TypeReponse = 'texte_court' | 'texte_long'`
  - `interface Question { code: string; section: Section; groupe: number; ordre: number; intitule: string; aide?: string; type: TypeReponse; obligatoire: boolean }`
  - `QUESTIONS: Question[]`
  - `VERSION_CATALOGUE = 1`
  - `questionsDeSection(section: Section): Question[]`

- [ ] **Step 1: Écrire le test qui échoue**

`tests/domaine/questions.test.ts` :

```ts
import { QUESTIONS, VERSION_CATALOGUE, questionsDeSection } from '../../src/domaine/questions';

test('les codes de question sont uniques', () => {
  const codes = QUESTIONS.map((q) => q.code);
  expect(new Set(codes).size).toBe(codes.length);
});

test('les deux sections sont peuplées', () => {
  expect(questionsDeSection('personnel').length).toBeGreaterThan(10);
  expect(questionsDeSection('professionnel').length).toBeGreaterThan(10);
});

test('chaque section est ordonnée sans trou', () => {
  for (const section of ['personnel', 'professionnel'] as const) {
    const ordres = questionsDeSection(section).map((q) => q.ordre);
    expect(ordres).toEqual([...Array(ordres.length).keys()].map((i) => i + 1));
  }
});

test('le catalogue est versionné', () => {
  expect(VERSION_CATALOGUE).toBe(1);
});
```

- [ ] **Step 2: Lancer le test et vérifier qu'il échoue**

Commande : `npm test -- tests/domaine/questions.test.ts`
Attendu : ÉCHEC — module `questions` introuvable

- [ ] **Step 3: Écrire les types**

`src/domaine/types.ts` :

```ts
export type Section = 'personnel' | 'professionnel';
export type TypeReponse = 'texte_court' | 'texte_long';

export interface Question {
  code: string;
  section: Section;
  /** Numéro de la question dans la fiche papier d'origine. */
  groupe: number;
  ordre: number;
  intitule: string;
  aide?: string;
  type: TypeReponse;
  obligatoire: boolean;
}

export type StatutBilan = 'brouillon' | 'gele';

export interface Bilan {
  id: string;
  statut: StatutBilan;
  versionCatalogue: number;
  creeLe: string;
  geleLe: string | null;
}
```

- [ ] **Step 4: Écrire le catalogue**

`src/domaine/questions.ts` :

```ts
import type { Question, Section } from './types';

export const VERSION_CATALOGUE = 1;

function q(
  code: string,
  section: Section,
  groupe: number,
  intitule: string,
  type: Question['type'] = 'texte_long',
  aide?: string,
  obligatoire = false,
): Omit<Question, 'ordre'> {
  return { code, section, groupe, intitule, type, aide, obligatoire };
}

const PERSONNEL: Omit<Question, 'ordre'>[] = [
  q('p_nom', 'personnel', 1, 'Quels sont vos nom et prénoms ?', 'texte_court', undefined, true),
  q('p_naissance', 'personnel', 1, 'Quelle est votre date de naissance ?', 'texte_court', 'Format JJ/MM/AAAA', true),
  q('p_famille', 'personnel', 1, 'Quelle est votre situation familiale ?', 'texte_court'),
  q('p_etudes', 'personnel', 1, 'Quelles études universitaires avez-vous suivies ?', 'texte_court'),
  q('p_niveau', 'personnel', 1, "Quel est votre niveau d'étude ?", 'texte_court'),
  q('p_profession', 'personnel', 1, 'Quelle est votre profession ?', 'texte_court'),
  q('p_dernier_poste', 'personnel', 1, 'Quel est le dernier poste que vous avez occupé ?', 'texte_court'),
  q('p_aime', 'personnel', 1, "Qu'est-ce que vous aimez ?"),
  q('p_aime_pas', 'personnel', 1, "Qu'est-ce que vous n'aimez pas ?"),
  q('p_plaisir', 'personnel', 1, 'Qu\'est-ce qui vous fait plaisir dans la vie ?'),
  q('p_interets', 'personnel', 1, "Quels sont vos différents centres d'intérêt ?"),
  q('p_loisirs', 'personnel', 1, 'Quels sont vos loisirs préférés ?'),
  q('p_defauts', 'personnel', 1, 'Quels sont vos défauts ?'),
  q('p_qualites', 'personnel', 1, 'Quelles sont vos qualités ?'),
  q('p_valeurs', 'personnel', 1, 'Quelles sont vos valeurs ?'),
  q('p_ambitions', 'personnel', 1, 'Quelles sont vos ambitions ?', 'texte_long', 'Distinguez les ambitions personnelles des ambitions professionnelles.'),
  q('p_vision', 'personnel', 1, 'Quelle est la vision principale que vous avez pour votre vie ?'),
  q('p_reussite', 'personnel', 1, 'Quel est, selon vous, le profil parfait de réussite ?'),
  q('p_bonheur', 'personnel', 1, 'Quelle définition donnez-vous au bonheur ?'),
  q('p_peur', 'personnel', 1, 'De quoi avez-vous le plus peur dans la vie ?'),
  q('p_peurs_surmontees', 'personnel', 1, 'Quelles sont les peurs que vous avez déjà réussi à surmonter ?'),
  q('p_phobies', 'personnel', 1, 'Quelles sont vos phobies actuelles ?'),
  q('p_passion', 'personnel', 2, 'Quelle est votre passion ?', 'texte_long', "Ce que vous aimez faire au quotidien avec intérêt, engagement et bonheur. Avoir plusieurs passions est normal."),
  q('p_vision_terre', 'personnel', 3, 'Quelle est votre vision de la vie sur Terre ?', 'texte_long', 'Êtes-vous ici pour gagner de l\'argent, pour être utile à la communauté, pour autre chose ?'),
  q('p_metier_reve', 'personnel', 4, 'Quel est votre métier de rêve, et pourquoi ce choix ?'),
  q('p_engagement', 'personnel', 5, 'Comment mesurez-vous votre niveau d\'engagement dans vos projets personnels ?'),
  q('p_50000', 'personnel', 5, 'Vous avez besoin de 50 000 francs CFA pour un besoin pressant. Que faites-vous ?'),
  q('p_objectifs_quotidien', 'personnel', 6, 'Que faites-vous au quotidien pour répondre à vos ambitions ?', 'texte_long', 'Vous fixez-vous des objectifs ? Que faites-vous pour les atteindre ?'),
  q('p_difficultes', 'personnel', 7, 'En cas de difficulté durable, abandonnez-vous ou testez-vous d\'autres possibilités ?'),
  q('p_echec', 'personnel', 8, 'Quelle est votre compréhension de l\'échec ?', 'texte_long', 'À quel moment peut-on dire qu\'une personne a échoué ?'),
  q('p_remise_en_question', 'personnel', 9, 'Êtes-vous capable de vous remettre en question ?'),
  q('p_incredules', 'personnel', 10, 'Comment réagissez-vous face à ceux qui ne croient pas en vous ?'),
  q('p_modeles', 'personnel', 11, 'Avez-vous des modèles, mentors ou références ? Lesquels, et pourquoi eux ?'),
  q('p_a_travailler', 'personnel', 11, 'Quels sont les points sur lesquels vous devez travailler ?'),
];

const PROFESSIONNEL: Omit<Question, 'ordre'>[] = [
  q('pro_academique', 'professionnel', 1, 'Décrivez votre parcours académique et vos trois derniers diplômes.'),
  q('pro_parcours', 'professionnel', 2, 'Décrivez votre parcours professionnel des cinq dernières années.'),
  q('pro_poste', 'professionnel', 3, 'Quel poste occupez-vous actuellement ? Décrivez-le.'),
  q('pro_competences_formation', 'professionnel', 4, 'Quelles compétences techniques tenez-vous de votre formation de base ?'),
  q('pro_competences_emploi', 'professionnel', 5, 'Quelles compétences techniques tenez-vous de votre activité actuelle ?'),
  q('pro_annexes_formation', 'professionnel', 6, 'Quelles compétences complémentaires tenez-vous de votre formation ?'),
  q('pro_annexes_emploi', 'professionnel', 7, 'Quelles compétences complémentaires tenez-vous de votre activité actuelle ?'),
  q('pro_projet', 'professionnel', 9, 'Avez-vous un projet professionnel ? Décrivez-en les grandes lignes.'),
  q('pro_plan_carriere', 'professionnel', 10, 'Quel est votre plan de carrière ?'),
  q('pro_superieur', 'professionnel', 11, 'Qui êtes-vous selon votre supérieur hiérarchique ?'),
  q('pro_collegues', 'professionnel', 12, 'Qui êtes-vous selon vos collègues ?'),
  q('pro_externes', 'professionnel', 13, 'Qui êtes-vous selon les acteurs externes de votre entreprise ?'),
  q('pro_satisfaction', 'professionnel', 14, 'Êtes-vous satisfait de votre situation professionnelle actuelle ? Pourquoi ?'),
  q('pro_qualifications_suffisantes', 'professionnel', 15, 'Vos qualifications actuelles permettent-elles votre plan de carrière ?'),
  q('pro_qualifications_requises', 'professionnel', 16, 'Quelles qualifications sont requises pour atteindre vos objectifs ?'),
  q('pro_qualifications_possedees', 'professionnel', 17, 'Lesquelles possédez-vous déjà ?'),
  q('pro_qualifications_manquantes', 'professionnel', 18, 'Lesquelles vous manquent aujourd\'hui ?'),
  q('pro_fiertes', 'professionnel', 19, 'De quelles réalisations professionnelles de l\'année écoulée êtes-vous fier ?'),
  q('pro_reproches', 'professionnel', 20, 'Que vous reprochez-vous sur le plan professionnel cette année ?'),
];

function numeroter(questions: Omit<Question, 'ordre'>[]): Question[] {
  return questions.map((question, index) => ({ ...question, ordre: index + 1 }));
}

export const QUESTIONS: Question[] = [
  ...numeroter(PERSONNEL),
  ...numeroter(PROFESSIONNEL),
];

export function questionsDeSection(section: Section): Question[] {
  return QUESTIONS.filter((question) => question.section === section);
}
```

- [ ] **Step 5: Lancer les tests et vérifier qu'ils passent**

Commande : `npm test -- tests/domaine/questions.test.ts`
Attendu : SUCCÈS — 4 tests passés

- [ ] **Step 6: Commit**

```bash
git add src/domaine tests/domaine
git commit -m "feat(domaine): catalogue versionné des questions du bilan"
```

---

### Task 5: Dépôt du bilan et règle de gel

Le cœur métier de ce plan. Un bilan gelé doit refuser toute écriture — c'est la garantie qui rend la génération reproductible et la comparaison annuelle possible.

**Files:**
- Create: `src/donnees/depot-bilan.ts`
- Test: `tests/donnees/depot-bilan.test.ts`

**Interfaces:**
- Consumes: `PiloteSql`, `migrer`, `QUESTIONS`, `VERSION_CATALOGUE`, `Bilan`
- Produces:
  - `class BilanGeleErreur extends Error`
  - `interface DepotBilan { creerBrouillon(): Promise<Bilan>; bilanCourant(): Promise<Bilan | null>; repondre(bilanId: string, questionCode: string, valeur: string): Promise<void>; reponses(bilanId: string): Promise<Record<string, string>>; progression(bilanId: string): Promise<{ repondues: number; total: number }>; geler(bilanId: string): Promise<Bilan>; }`
  - `class DepotBilanSql implements DepotBilan { constructor(pilote: PiloteSql, maintenant?: () => string) }`

- [ ] **Step 1: Écrire le test qui échoue**

`tests/donnees/depot-bilan.test.ts` :

```ts
import { PiloteNode } from '../../src/donnees/pilote-node';
import { migrer } from '../../src/donnees/migrer';
import { DepotBilanSql, BilanGeleErreur } from '../../src/donnees/depot-bilan';
import { QUESTIONS } from '../../src/domaine/questions';

async function depotNeuf() {
  const pilote = new PiloteNode();
  await migrer(pilote);
  return new DepotBilanSql(pilote, () => '2026-09-10');
}

test('crée un brouillon et le retrouve comme bilan courant', async () => {
  const depot = await depotNeuf();
  const cree = await depot.creerBrouillon();
  expect(cree.statut).toBe('brouillon');
  expect((await depot.bilanCourant())?.id).toBe(cree.id);
});

test('enregistre une réponse et la relit', async () => {
  const depot = await depotNeuf();
  const bilan = await depot.creerBrouillon();
  await depot.repondre(bilan.id, 'p_aime', 'la moto');
  expect(await depot.reponses(bilan.id)).toEqual({ p_aime: 'la moto' });
});

test('réécrire une réponse la remplace au lieu de la dupliquer', async () => {
  const depot = await depotNeuf();
  const bilan = await depot.creerBrouillon();
  await depot.repondre(bilan.id, 'p_aime', 'la moto');
  await depot.repondre(bilan.id, 'p_aime', 'la moto et le code');
  expect(await depot.reponses(bilan.id)).toEqual({ p_aime: 'la moto et le code' });
});

test('la progression compte les réponses non vides sur le total du catalogue', async () => {
  const depot = await depotNeuf();
  const bilan = await depot.creerBrouillon();
  await depot.repondre(bilan.id, 'p_aime', 'la moto');
  expect(await depot.progression(bilan.id)).toEqual({ repondues: 1, total: QUESTIONS.length });
});

test('une réponse vide efface la réponse au lieu de la stocker', async () => {
  const depot = await depotNeuf();
  const bilan = await depot.creerBrouillon();
  await depot.repondre(bilan.id, 'p_aime', 'la moto');
  await depot.repondre(bilan.id, 'p_aime', '   ');
  expect(await depot.reponses(bilan.id)).toEqual({});
});

test('geler date le bilan et change son statut', async () => {
  const depot = await depotNeuf();
  const bilan = await depot.creerBrouillon();
  const gele = await depot.geler(bilan.id);
  expect(gele.statut).toBe('gele');
  expect(gele.geleLe).toBe('2026-09-10');
});

test('un bilan gelé refuse toute écriture', async () => {
  const depot = await depotNeuf();
  const bilan = await depot.creerBrouillon();
  await depot.geler(bilan.id);
  await expect(depot.repondre(bilan.id, 'p_aime', 'autre chose')).rejects.toThrow(BilanGeleErreur);
});

test('geler deux fois échoue', async () => {
  const depot = await depotNeuf();
  const bilan = await depot.creerBrouillon();
  await depot.geler(bilan.id);
  await expect(depot.geler(bilan.id)).rejects.toThrow(BilanGeleErreur);
});
```

- [ ] **Step 2: Lancer les tests et vérifier qu'ils échouent**

Commande : `npm test -- tests/donnees/depot-bilan.test.ts`
Attendu : ÉCHEC — module `depot-bilan` introuvable

- [ ] **Step 3: Écrire le dépôt**

`src/donnees/depot-bilan.ts` :

```ts
import type { PiloteSql } from './pilote';
import type { Bilan } from '../domaine/types';
import { QUESTIONS, VERSION_CATALOGUE } from '../domaine/questions';

export class BilanGeleErreur extends Error {
  constructor(message = 'Ce bilan est gelé et ne peut plus être modifié.') {
    super(message);
    this.name = 'BilanGeleErreur';
  }
}

export interface DepotBilan {
  creerBrouillon(): Promise<Bilan>;
  bilanCourant(): Promise<Bilan | null>;
  repondre(bilanId: string, questionCode: string, valeur: string): Promise<void>;
  reponses(bilanId: string): Promise<Record<string, string>>;
  progression(bilanId: string): Promise<{ repondues: number; total: number }>;
  geler(bilanId: string): Promise<Bilan>;
}

interface LigneBilan {
  id: string;
  statut: 'brouillon' | 'gele';
  version_catalogue: number;
  cree_le: string;
  gele_le: string | null;
}

function versBilan(ligne: LigneBilan): Bilan {
  return {
    id: ligne.id,
    statut: ligne.statut,
    versionCatalogue: ligne.version_catalogue,
    creeLe: ligne.cree_le,
    geleLe: ligne.gele_le,
  };
}

function aujourdHuiLocal(): string {
  const maintenant = new Date();
  const mois = String(maintenant.getMonth() + 1).padStart(2, '0');
  const jour = String(maintenant.getDate()).padStart(2, '0');
  return `${maintenant.getFullYear()}-${mois}-${jour}`;
}

export class DepotBilanSql implements DepotBilan {
  constructor(
    private readonly pilote: PiloteSql,
    private readonly maintenant: () => string = aujourdHuiLocal,
  ) {}

  async creerBrouillon(): Promise<Bilan> {
    const id = crypto.randomUUID();
    await this.pilote.executer(
      'INSERT INTO bilans (id, statut, version_catalogue, cree_le) VALUES (?, ?, ?, ?)',
      [id, 'brouillon', VERSION_CATALOGUE, this.maintenant()],
    );
    return { id, statut: 'brouillon', versionCatalogue: VERSION_CATALOGUE, creeLe: this.maintenant(), geleLe: null };
  }

  async bilanCourant(): Promise<Bilan | null> {
    const lignes = await this.pilote.lire<LigneBilan>(
      'SELECT * FROM bilans ORDER BY cree_le DESC, rowid DESC LIMIT 1',
    );
    return lignes.length ? versBilan(lignes[0]) : null;
  }

  private async exigerBrouillon(bilanId: string): Promise<void> {
    const lignes = await this.pilote.lire<LigneBilan>('SELECT * FROM bilans WHERE id = ?', [bilanId]);
    if (!lignes.length) throw new Error(`Bilan introuvable : ${bilanId}`);
    if (lignes[0].statut === 'gele') throw new BilanGeleErreur();
  }

  async repondre(bilanId: string, questionCode: string, valeur: string): Promise<void> {
    await this.exigerBrouillon(bilanId);
    const propre = valeur.trim();
    if (propre === '') {
      await this.pilote.executer('DELETE FROM reponses WHERE bilan_id = ? AND question_code = ?', [bilanId, questionCode]);
      return;
    }
    await this.pilote.executer(
      `INSERT INTO reponses (bilan_id, question_code, valeur, maj_le) VALUES (?, ?, ?, ?)
       ON CONFLICT (bilan_id, question_code) DO UPDATE SET valeur = excluded.valeur, maj_le = excluded.maj_le`,
      [bilanId, questionCode, propre, this.maintenant()],
    );
  }

  async reponses(bilanId: string): Promise<Record<string, string>> {
    const lignes = await this.pilote.lire<{ question_code: string; valeur: string }>(
      'SELECT question_code, valeur FROM reponses WHERE bilan_id = ?',
      [bilanId],
    );
    return Object.fromEntries(lignes.map((l) => [l.question_code, l.valeur]));
  }

  async progression(bilanId: string): Promise<{ repondues: number; total: number }> {
    const lignes = await this.pilote.lire<{ n: number }>(
      'SELECT COUNT(*) AS n FROM reponses WHERE bilan_id = ?',
      [bilanId],
    );
    return { repondues: lignes[0].n, total: QUESTIONS.length };
  }

  async geler(bilanId: string): Promise<Bilan> {
    await this.exigerBrouillon(bilanId);
    const date = this.maintenant();
    await this.pilote.executer('UPDATE bilans SET statut = ?, gele_le = ? WHERE id = ?', ['gele', date, bilanId]);
    const [ligne] = await this.pilote.lire<LigneBilan>('SELECT * FROM bilans WHERE id = ?', [bilanId]);
    return versBilan(ligne);
  }
}
```

- [ ] **Step 4: Lancer les tests et vérifier qu'ils passent**

Commande : `npm test -- tests/donnees/depot-bilan.test.ts`
Attendu : SUCCÈS — 8 tests passés

- [ ] **Step 5: Commit**

```bash
git add src/donnees/depot-bilan.ts tests/donnees/depot-bilan.test.ts
git commit -m "feat(donnees): dépôt du bilan avec règle d'immuabilité après gel"
```

---

### Task 6: Dépôt des paramètres et écran de démarrage

**Files:**
- Create: `src/donnees/depot-parametres.ts`, `src/ui/ecrans/Demarrage.tsx`
- Test: `tests/donnees/depot-parametres.test.ts`, `tests/ui/Demarrage.test.tsx`

**Interfaces:**
- Consumes: `PiloteSql`
- Produces:
  - `interface Reglages { prenom: string; fuseau: string; heureRappel: string }`
  - `class DepotParametresSql { lire(): Promise<Reglages | null>; enregistrer(reglages: Reglages): Promise<void> }`
  - `Demarrage({ onValider }: { onValider(reglages: Reglages): void })`
  - `fuseauDeLAppareil(): string`

- [ ] **Step 1: Écrire les tests qui échouent**

`tests/donnees/depot-parametres.test.ts` :

```ts
import { PiloteNode } from '../../src/donnees/pilote-node';
import { migrer } from '../../src/donnees/migrer';
import { DepotParametresSql } from '../../src/donnees/depot-parametres';

async function depotNeuf() {
  const pilote = new PiloteNode();
  await migrer(pilote);
  return new DepotParametresSql(pilote);
}

test('renvoie null tant que rien n\'a été enregistré', async () => {
  expect(await (await depotNeuf()).lire()).toBeNull();
});

test('enregistre puis relit les réglages', async () => {
  const depot = await depotNeuf();
  const reglages = { prenom: 'Yannick', fuseau: 'Africa/Ouagadougou', heureRappel: '20:00' };
  await depot.enregistrer(reglages);
  expect(await depot.lire()).toEqual(reglages);
});

test('un second enregistrement remplace le premier', async () => {
  const depot = await depotNeuf();
  await depot.enregistrer({ prenom: 'Yannick', fuseau: 'Africa/Ouagadougou', heureRappel: '20:00' });
  await depot.enregistrer({ prenom: 'Yannick', fuseau: 'Africa/Ouagadougou', heureRappel: '21:30' });
  expect((await depot.lire())?.heureRappel).toBe('21:30');
});
```

`tests/ui/Demarrage.test.tsx` :

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Demarrage } from '../../src/ui/ecrans/Demarrage';

test('ne valide pas tant que le prénom est vide', async () => {
  const onValider = vi.fn();
  render(<Demarrage onValider={onValider} />);
  await userEvent.click(screen.getByRole('button', { name: 'Commencer' }));
  expect(onValider).not.toHaveBeenCalled();
});

test('remonte les réglages saisis', async () => {
  const onValider = vi.fn();
  render(<Demarrage onValider={onValider} />);
  await userEvent.type(screen.getByLabelText('Votre prénom'), 'Yannick');
  await userEvent.clear(screen.getByLabelText('Heure de votre point quotidien'));
  await userEvent.type(screen.getByLabelText('Heure de votre point quotidien'), '20:00');
  await userEvent.click(screen.getByRole('button', { name: 'Commencer' }));
  expect(onValider).toHaveBeenCalledWith(
    expect.objectContaining({ prenom: 'Yannick', heureRappel: '20:00' }),
  );
});
```

- [ ] **Step 2: Installer la dépendance de test manquante et vérifier l'échec**

```bash
npm install -D @testing-library/user-event
npm test -- tests/donnees/depot-parametres.test.ts tests/ui/Demarrage.test.tsx
```

Attendu : ÉCHEC — modules `depot-parametres` et `Demarrage` introuvables

- [ ] **Step 3: Écrire le dépôt des paramètres**

`src/donnees/depot-parametres.ts` :

```ts
import type { PiloteSql } from './pilote';

export interface Reglages {
  prenom: string;
  fuseau: string;
  heureRappel: string;
}

const CLES: (keyof Reglages)[] = ['prenom', 'fuseau', 'heureRappel'];

export class DepotParametresSql {
  constructor(private readonly pilote: PiloteSql) {}

  async lire(): Promise<Reglages | null> {
    const lignes = await this.pilote.lire<{ cle: string; valeur: string }>('SELECT cle, valeur FROM parametres');
    const carte = new Map(lignes.map((l) => [l.cle, l.valeur]));
    if (!CLES.every((cle) => carte.has(cle))) return null;
    return {
      prenom: carte.get('prenom')!,
      fuseau: carte.get('fuseau')!,
      heureRappel: carte.get('heureRappel')!,
    };
  }

  async enregistrer(reglages: Reglages): Promise<void> {
    for (const cle of CLES) {
      await this.pilote.executer(
        `INSERT INTO parametres (cle, valeur) VALUES (?, ?)
         ON CONFLICT (cle) DO UPDATE SET valeur = excluded.valeur`,
        [cle, reglages[cle]],
      );
    }
  }
}
```

- [ ] **Step 4: Écrire l'écran de démarrage**

`src/ui/ecrans/Demarrage.tsx` :

```tsx
import { useState } from 'react';
import type { Reglages } from '../../donnees/depot-parametres';

export function fuseauDeLAppareil(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Africa/Ouagadougou';
}

export function Demarrage({ onValider }: { onValider(reglages: Reglages): void }) {
  const [prenom, setPrenom] = useState('');
  const [heureRappel, setHeureRappel] = useState('20:00');
  const fuseau = fuseauDeLAppareil();

  function valider() {
    if (prenom.trim() === '') return;
    onValider({ prenom: prenom.trim(), fuseau, heureRappel });
  }

  return (
    <main>
      <h1>Bienvenue</h1>
      <p>Trois questions, puis on commence. Aucune donnée ne quitte ce téléphone.</p>

      <label htmlFor="prenom">Votre prénom</label>
      <input id="prenom" value={prenom} onChange={(e) => setPrenom(e.target.value)} />

      <label htmlFor="heure">Heure de votre point quotidien</label>
      <input id="heure" type="time" value={heureRappel} onChange={(e) => setHeureRappel(e.target.value)} />

      <p>Fuseau détecté : {fuseau}</p>

      <button type="button" onClick={valider}>Commencer</button>
    </main>
  );
}
```

- [ ] **Step 5: Lancer les tests et vérifier qu'ils passent**

Commande : `npm test -- tests/donnees/depot-parametres.test.ts tests/ui/Demarrage.test.tsx`
Attendu : SUCCÈS — 5 tests passés

- [ ] **Step 6: Commit**

```bash
git add src/donnees/depot-parametres.ts src/ui/ecrans/Demarrage.tsx tests/donnees/depot-parametres.test.ts tests/ui/Demarrage.test.tsx
git commit -m "feat: réglages persistants et écran de premier lancement"
```

---

### Task 7: L'écran du bilan

Une question par écran, sauvegarde à chaque frappe, reprise exacte au point d'arrêt.

**Files:**
- Create: `src/ui/ecrans/Bilan.tsx`
- Test: `tests/ui/Bilan.test.tsx`

**Interfaces:**
- Consumes: `QUESTIONS`, `DepotBilan`, `Bilan`
- Produces: `EcranBilan({ depot, bilan, onTermine }: { depot: DepotBilan; bilan: BilanType; onTermine(): void })` — nommé `EcranBilan` et non `Bilan` pour éviter la collision avec le type `Bilan` du domaine

- [ ] **Step 1: Écrire le test qui échoue**

`tests/ui/Bilan.test.tsx` :

```tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PiloteNode } from '../../src/donnees/pilote-node';
import { migrer } from '../../src/donnees/migrer';
import { DepotBilanSql } from '../../src/donnees/depot-bilan';
import { EcranBilan } from '../../src/ui/ecrans/Bilan';
import { QUESTIONS } from '../../src/domaine/questions';

async function contexte() {
  const pilote = new PiloteNode();
  await migrer(pilote);
  const depot = new DepotBilanSql(pilote, () => '2026-09-10');
  const bilan = await depot.creerBrouillon();
  return { depot, bilan };
}

test('affiche la première question du catalogue', async () => {
  const { depot, bilan } = await contexte();
  render(<EcranBilan depot={depot} bilan={bilan} onTermine={vi.fn()} />);
  expect(await screen.findByText(QUESTIONS[0].intitule)).toBeInTheDocument();
});

test('enregistre la réponse et avance à la question suivante', async () => {
  const { depot, bilan } = await contexte();
  render(<EcranBilan depot={depot} bilan={bilan} onTermine={vi.fn()} />);
  await screen.findByText(QUESTIONS[0].intitule);

  await userEvent.type(screen.getByLabelText('Votre réponse'), 'Yannick Ulrich');
  await userEvent.click(screen.getByRole('button', { name: 'Suivant' }));

  expect(await screen.findByText(QUESTIONS[1].intitule)).toBeInTheDocument();
  await waitFor(async () => {
    expect((await depot.reponses(bilan.id))[QUESTIONS[0].code]).toBe('Yannick Ulrich');
  });
});

test('reprend à la première question sans réponse', async () => {
  const { depot, bilan } = await contexte();
  await depot.repondre(bilan.id, QUESTIONS[0].code, 'déjà répondu');
  render(<EcranBilan depot={depot} bilan={bilan} onTermine={vi.fn()} />);
  expect(await screen.findByText(QUESTIONS[1].intitule)).toBeInTheDocument();
});

test('affiche la progression', async () => {
  const { depot, bilan } = await contexte();
  render(<EcranBilan depot={depot} bilan={bilan} onTermine={vi.fn()} />);
  expect(await screen.findByText(`1 / ${QUESTIONS.length}`)).toBeInTheDocument();
});

test('appelle onTermine à la dernière question', async () => {
  const { depot, bilan } = await contexte();
  for (const question of QUESTIONS.slice(0, -1)) {
    await depot.repondre(bilan.id, question.code, 'x');
  }
  const onTermine = vi.fn();
  render(<EcranBilan depot={depot} bilan={bilan} onTermine={onTermine} />);
  await screen.findByText(QUESTIONS[QUESTIONS.length - 1].intitule);
  await userEvent.type(screen.getByLabelText('Votre réponse'), 'dernière');
  await userEvent.click(screen.getByRole('button', { name: 'Terminer' }));
  await waitFor(() => expect(onTermine).toHaveBeenCalled());
});
```

- [ ] **Step 2: Lancer les tests et vérifier qu'ils échouent**

Commande : `npm test -- tests/ui/Bilan.test.tsx`
Attendu : ÉCHEC — module `Bilan` introuvable

- [ ] **Step 3: Écrire l'écran**

`src/ui/ecrans/Bilan.tsx` :

```tsx
import { useEffect, useState } from 'react';
import { QUESTIONS } from '../../domaine/questions';
import type { Bilan as BilanType } from '../../domaine/types';
import type { DepotBilan } from '../../donnees/depot-bilan';

interface Props {
  depot: DepotBilan;
  bilan: BilanType;
  onTermine(): void;
}

export function EcranBilan({ depot, bilan, onTermine }: Props) {
  const [index, setIndex] = useState<number | null>(null);
  const [valeur, setValeur] = useState('');

  useEffect(() => {
    depot.reponses(bilan.id).then((reponses) => {
      const premierSansReponse = QUESTIONS.findIndex((q) => !reponses[q.code]);
      const depart = premierSansReponse === -1 ? QUESTIONS.length - 1 : premierSansReponse;
      setIndex(depart);
      setValeur(reponses[QUESTIONS[depart].code] ?? '');
    });
  }, [depot, bilan.id]);

  if (index === null) return <p>Chargement…</p>;

  const question = QUESTIONS[index];
  const derniere = index === QUESTIONS.length - 1;

  async function avancer() {
    await depot.repondre(bilan.id, question.code, valeur);
    if (derniere) {
      onTermine();
      return;
    }
    const suivant = index! + 1;
    const reponses = await depot.reponses(bilan.id);
    setIndex(suivant);
    setValeur(reponses[QUESTIONS[suivant].code] ?? '');
  }

  async function reculer() {
    await depot.repondre(bilan.id, question.code, valeur);
    const precedent = Math.max(0, index! - 1);
    const reponses = await depot.reponses(bilan.id);
    setIndex(precedent);
    setValeur(reponses[QUESTIONS[precedent].code] ?? '');
  }

  return (
    <main>
      <p>{index + 1} / {QUESTIONS.length}</p>
      <h2>{question.intitule}</h2>
      {question.aide && <p>{question.aide}</p>}

      <label htmlFor="reponse">Votre réponse</label>
      {question.type === 'texte_court' ? (
        <input id="reponse" value={valeur} onChange={(e) => setValeur(e.target.value)} />
      ) : (
        <textarea id="reponse" rows={6} value={valeur} onChange={(e) => setValeur(e.target.value)} />
      )}

      <div>
        {index > 0 && <button type="button" onClick={reculer}>Précédent</button>}
        <button type="button" onClick={avancer}>{derniere ? 'Terminer' : 'Suivant'}</button>
      </div>
    </main>
  );
}
```

- [ ] **Step 4: Lancer les tests et vérifier qu'ils passent**

Commande : `npm test -- tests/ui/Bilan.test.tsx`
Attendu : SUCCÈS — 5 tests passés

- [ ] **Step 5: Commit**

```bash
git add src/ui/ecrans/Bilan.tsx tests/ui/Bilan.test.tsx
git commit -m "feat(ui): écran du bilan, une question par écran avec reprise"
```

---

### Task 8: Export JSON et suppression totale

L'utilisateur doit pouvoir emporter ses données et les effacer (spec § 9). L'export est aussi la porte d'entrée vers la v2.

**Files:**
- Create: `src/donnees/export.ts`, `src/ui/ecrans/Reglages.tsx`
- Test: `tests/donnees/export.test.ts`

**Interfaces:**
- Consumes: `PiloteSql`, `Reglages`
- Produces:
  - `exporterTout(pilote: PiloteSql): Promise<string>` — JSON indenté
  - `supprimerTout(pilote: PiloteSql): Promise<void>`
  - `EcranReglages({ pilote }: { pilote: PiloteSql })`

- [ ] **Step 1: Écrire le test qui échoue**

`tests/donnees/export.test.ts` :

```ts
import { PiloteNode } from '../../src/donnees/pilote-node';
import { migrer } from '../../src/donnees/migrer';
import { DepotBilanSql } from '../../src/donnees/depot-bilan';
import { exporterTout, supprimerTout } from '../../src/donnees/export';

async function contexte() {
  const pilote = new PiloteNode();
  await migrer(pilote);
  const depot = new DepotBilanSql(pilote, () => '2026-09-10');
  const bilan = await depot.creerBrouillon();
  await depot.repondre(bilan.id, 'p_aime', 'la moto');
  return { pilote, bilan };
}

test("l'export contient la version, la date et les réponses", async () => {
  const { pilote } = await contexte();
  const contenu = JSON.parse(await exporterTout(pilote));
  expect(contenu.versionSchema).toBe(1);
  expect(contenu.exporteLe).toMatch(/^\d{4}-\d{2}-\d{2}/);
  expect(contenu.tables.reponses).toContainEqual(
    expect.objectContaining({ question_code: 'p_aime', valeur: 'la moto' }),
  );
});

test('la suppression vide toutes les tables mais garde le schéma', async () => {
  const { pilote } = await contexte();
  await supprimerTout(pilote);
  const contenu = JSON.parse(await exporterTout(pilote));
  expect(contenu.tables.bilans).toEqual([]);
  expect(contenu.tables.reponses).toEqual([]);
  expect(contenu.versionSchema).toBe(1);
});
```

- [ ] **Step 2: Lancer les tests et vérifier qu'ils échouent**

Commande : `npm test -- tests/donnees/export.test.ts`
Attendu : ÉCHEC — module `export` introuvable

- [ ] **Step 3: Écrire l'export et la suppression**

`src/donnees/export.ts` :

```ts
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
```

- [ ] **Step 4: Écrire l'écran de réglages**

`src/ui/ecrans/Reglages.tsx` :

```tsx
import { useState } from 'react';
import type { PiloteSql } from '../../donnees/pilote';
import { exporterTout, supprimerTout } from '../../donnees/export';

export function EcranReglages({ pilote }: { pilote: PiloteSql }) {
  const [message, setMessage] = useState('');
  const [confirmation, setConfirmation] = useState(false);

  async function exporter() {
    const contenu = await exporterTout(pilote);
    const lien = document.createElement('a');
    lien.href = URL.createObjectURL(new Blob([contenu], { type: 'application/json' }));
    lien.download = `childeric-export-${new Date().toISOString().slice(0, 10)}.json`;
    lien.click();
    setMessage('Export généré.');
  }

  async function supprimer() {
    await supprimerTout(pilote);
    setConfirmation(false);
    setMessage('Toutes vos données ont été supprimées.');
  }

  return (
    <main>
      <h2>Réglages</h2>
      <p>Vos données sont stockées uniquement sur ce téléphone.</p>

      <button type="button" onClick={exporter}>Exporter mes données</button>

      {confirmation ? (
        <div>
          <p>Cette suppression est définitive. Exportez d'abord si vous voulez garder une trace.</p>
          <button type="button" onClick={supprimer}>Oui, tout supprimer</button>
          <button type="button" onClick={() => setConfirmation(false)}>Annuler</button>
        </div>
      ) : (
        <button type="button" onClick={() => setConfirmation(true)}>Supprimer toutes mes données</button>
      )}

      {message && <p role="status">{message}</p>}
    </main>
  );
}
```

- [ ] **Step 5: Lancer les tests et vérifier qu'ils passent**

Commande : `npm test -- tests/donnees/export.test.ts`
Attendu : SUCCÈS — 2 tests passés

- [ ] **Step 6: Commit**

```bash
git add src/donnees/export.ts src/ui/ecrans/Reglages.tsx tests/donnees/export.test.ts
git commit -m "feat: export JSON complet et suppression totale des données"
```

---

### Task 9: Assemblage et APK v0.1

Tout existe mais rien n'est branché. Cette tâche relie les écrans et sort l'APK que vous installez.

**Files:**
- Modify: `src/ui/App.tsx`
- Test: `tests/ui/App.test.tsx`

**Interfaces:**
- Consumes: `obtenirBase`, `DepotBilanSql`, `DepotParametresSql`, `Demarrage`, `EcranBilan`, `EcranReglages`
- Produces: `App()` — aiguillage complet

- [ ] **Step 1: Réécrire le test de `App`**

`tests/ui/App.test.tsx` (remplace le contenu de la tâche 1) :

```tsx
import { render, screen } from '@testing-library/react';
import { App } from '../../src/ui/App';

vi.mock('../../src/donnees/base', async () => {
  const { PiloteNode } = await import('../../src/donnees/pilote-node');
  const { migrer } = await import('../../src/donnees/migrer');
  const pilote = new PiloteNode();
  return { obtenirBase: async () => { await migrer(pilote); return pilote; } };
});

test('propose le premier lancement quand aucun réglage n\'existe', async () => {
  render(<App />);
  expect(await screen.findByRole('heading', { name: 'Bienvenue' })).toBeInTheDocument();
});
```

- [ ] **Step 2: Lancer le test et vérifier qu'il échoue**

Commande : `npm test -- tests/ui/App.test.tsx`
Attendu : ÉCHEC — `App` affiche encore « Childeric » et « Schéma version »

- [ ] **Step 3: Écrire l'aiguillage**

`src/ui/App.tsx` :

```tsx
import { useEffect, useState } from 'react';
import { obtenirBase } from '../donnees/base';
import type { PiloteSql } from '../donnees/pilote';
import { DepotBilanSql } from '../donnees/depot-bilan';
import { DepotParametresSql, type Reglages } from '../donnees/depot-parametres';
import type { Bilan } from '../domaine/types';
import { Demarrage } from './ecrans/Demarrage';
import { EcranBilan } from './ecrans/Bilan';
import { EcranReglages } from './ecrans/Reglages';

type Etape = 'chargement' | 'demarrage' | 'bilan' | 'termine' | 'reglages';

export function App() {
  const [pilote, setPilote] = useState<PiloteSql | null>(null);
  const [etape, setEtape] = useState<Etape>('chargement');
  const [bilan, setBilan] = useState<Bilan | null>(null);

  useEffect(() => {
    (async () => {
      const base = await obtenirBase();
      setPilote(base);
      const reglages = await new DepotParametresSql(base).lire();
      if (!reglages) { setEtape('demarrage'); return; }
      const depot = new DepotBilanSql(base);
      const courant = (await depot.bilanCourant()) ?? (await depot.creerBrouillon());
      setBilan(courant);
      setEtape(courant.statut === 'gele' ? 'termine' : 'bilan');
    })();
  }, []);

  async function demarrer(reglages: Reglages) {
    await new DepotParametresSql(pilote!).enregistrer(reglages);
    const depot = new DepotBilanSql(pilote!);
    setBilan(await depot.creerBrouillon());
    setEtape('bilan');
  }

  async function terminerBilan() {
    await new DepotBilanSql(pilote!).geler(bilan!.id);
    setEtape('termine');
  }

  if (etape === 'chargement' || !pilote) return <p>Chargement…</p>;
  if (etape === 'demarrage') return <Demarrage onValider={demarrer} />;
  if (etape === 'bilan' && bilan) return <EcranBilan depot={new DepotBilanSql(pilote)} bilan={bilan} onTermine={terminerBilan} />;
  if (etape === 'reglages') return <EcranReglages pilote={pilote} />;

  return (
    <main>
      <h1>Bilan terminé</h1>
      <p>Votre bilan est gelé. La construction de votre plan 12 mois arrive dans la prochaine version.</p>
      <button type="button" onClick={() => setEtape('reglages')}>Réglages</button>
    </main>
  );
}
```

- [ ] **Step 4: Lancer toute la suite de tests**

Commande : `npm test`
Attendu : SUCCÈS — tous les tests passent

- [ ] **Step 5: Compiler et installer l'APK v0.1**

```bash
export JAVA_HOME="/c/Program Files/Android/Android Studio/jbr"
npm run build && npx cap sync android
cd android && ./gradlew assembleDebug && cd ..
"$LOCALAPPDATA/Android/Sdk/platform-tools/adb" install -r android/app/build/outputs/apk/debug/app-debug.apk
```

- [ ] **Step 6: Vérification manuelle sur le téléphone**

Dérouler cette liste, dans l'ordre, sur l'appareil :

1. Premier lancement : l'écran « Bienvenue » s'affiche, le fuseau détecté est correct.
2. Saisir un prénom, valider : la première question du bilan apparaît.
3. Répondre à trois questions, **fermer l'application complètement**, la rouvrir : elle reprend à la quatrième question.
4. Revenir en arrière : la réponse précédente est bien affichée.
5. Aller jusqu'au bout, appuyer sur « Terminer » : l'écran « Bilan terminé » s'affiche.
6. Rouvrir l'application : elle affiche directement « Bilan terminé » (le bilan est gelé).
7. Réglages → « Exporter mes données » : un fichier JSON est produit et contient vos réponses.
8. Réglages → suppression → confirmer : les données disparaissent.

- [ ] **Step 7: Commit et étiquette**

```bash
git add -A
git commit -m "feat: assemblage des écrans et APK v0.1 (bilan de bout en bout)"
git tag v0.1.0
git push && git push --tags
```

---

## Ce que ce plan ne fait pas

Volontairement absent, traité dans les plans 2 et 3 : la génération du plan 12 mois, le stockage sécurisé de la clé API, l'écran du jour, les séries, la clôture hebdomadaire, les notifications locales, la restitution.
