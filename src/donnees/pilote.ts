export interface PiloteSql {
  executer(sql: string, params?: unknown[]): Promise<void>;
  lire<T>(sql: string, params?: unknown[]): Promise<T[]>;
}
