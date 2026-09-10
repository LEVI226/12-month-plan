import { useEffect, useMemo, useState } from 'react';
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
  const [erreur, setErreur] = useState('');

  const depotBilan = useMemo(() => (pilote ? new DepotBilanSql(pilote) : null), [pilote]);

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
    try {
      await new DepotParametresSql(pilote!).enregistrer(reglages);
      const depot = new DepotBilanSql(pilote!);
      setBilan(await depot.creerBrouillon());
      setEtape('bilan');
      setErreur('');
    } catch (e) {
      setErreur(`Le démarrage a échoué : ${String(e)}. Réessayez.`);
    }
  }

  async function terminerBilan() {
    try {
      await new DepotBilanSql(pilote!).geler(bilan!.id);
      setEtape('termine');
      setErreur('');
    } catch (e) {
      setErreur(`La clôture du bilan a échoué : ${String(e)}. Vos réponses restent enregistrées, réessayez.`);
    }
  }

  if (etape === 'chargement' || !pilote) return <p>Chargement…</p>;
  if (etape === 'demarrage') return (
    <>
      {erreur && <p role="alert">{erreur}</p>}
      <Demarrage onValider={demarrer} />
    </>
  );
  if (etape === 'bilan' && bilan && depotBilan) return (
    <>
      {erreur && <p role="alert">{erreur}</p>}
      <EcranBilan depot={depotBilan} bilan={bilan} onTermine={terminerBilan} />
    </>
  );
  if (etape === 'reglages') return <EcranReglages pilote={pilote} onRetour={() => setEtape('termine')} />;

  return (
    <main>
      <h1>Bilan terminé</h1>
      <p>Votre bilan est gelé. La construction de votre plan 12 mois arrive dans la prochaine version.</p>
      <button type="button" onClick={() => setEtape('reglages')}>Réglages</button>
    </main>
  );
}
