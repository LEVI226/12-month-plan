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
  if (etape === 'reglages') return <EcranReglages pilote={pilote} onRetour={() => setEtape('termine')} />;

  return (
    <main>
      <h1>Bilan terminé</h1>
      <p>Votre bilan est gelé. La construction de votre plan 12 mois arrive dans la prochaine version.</p>
      <button type="button" onClick={() => setEtape('reglages')}>Réglages</button>
    </main>
  );
}
