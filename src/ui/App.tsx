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
