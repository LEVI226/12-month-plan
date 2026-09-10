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
