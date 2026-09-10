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
