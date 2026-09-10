import { CapacitorSQLite, SQLiteConnection, type SQLiteDBConnection } from '@capacitor-community/sqlite';
import type { PiloteSql } from './pilote';
import { extraireLignes } from './conversion';

const NOM_BASE = 'childeric';

export class PiloteCapacitor implements PiloteSql {
  private constructor(private readonly connexion: SQLiteDBConnection) {}

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
    return extraireLignes<T>(resultat);
  }
}
