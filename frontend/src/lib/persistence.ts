export interface StoragePort {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

export const STORAGE_KEYS = ['childeric:v1', 'childeric:v1:precedent', 'childeric:v1:corrompu'] as const;

// Serialize writes and deletion so a slow save cannot resurrect deleted data.
export function createPersistence<T>(storage: StoragePort, parse: (raw: string) => T) {
  let queue: Promise<unknown> = Promise.resolve();
  let writable = false;
  const serial = <R,>(operation: () => Promise<R>): Promise<R> => {
    const next = queue.then(operation, operation);
    queue = next.catch(() => {});
    return next;
  };
  return {
    async load(): Promise<{ state: T | null; message: string | null }> {
      const raw = await storage.getItem(STORAGE_KEYS[0]);
      if (raw === null) { writable = true; return { state: null, message: null }; }
      try {
        const state = parse(raw);
        writable = true;
        return { state, message: null };
      } catch {
        // Preserve evidence before permitting any replacement of the primary save.
        await storage.setItem(STORAGE_KEYS[2], raw);
        const previous = await storage.getItem(STORAGE_KEYS[1]);
        if (previous !== null) {
          try {
            const state = parse(previous);
            writable = true;
            return { state, message: 'Vos données ont été restaurées depuis la dernière sauvegarde valide.' };
          } catch { /* The corrupt primary is already quarantined. */ }
        }
        writable = true;
        return { state: null, message: 'Une sauvegarde illisible a été mise de côté. Vos données originales sont conservées pour récupération.' };
      }
    },
    save(state: T) {
      return serial(async () => {
        if (!writable) throw new Error('Lecture du stockage impossible. Aucun enregistrement effectué.');
        const next = JSON.stringify(state);
        parse(next);
        const current = await storage.getItem(STORAGE_KEYS[0]);
        if (current !== null) {
          let valid = false;
          try { parse(current); valid = true; } catch { /* Never replace a valid backup with corrupt data. */ }
          if (valid) await storage.setItem(STORAGE_KEYS[1], current);
        }
        await storage.setItem(STORAGE_KEYS[0], next);
      });
    },
    clear() {
      return serial(async () => {
        for (const key of STORAGE_KEYS) await storage.removeItem(key);
        writable = true;
      });
    },
  };
}
