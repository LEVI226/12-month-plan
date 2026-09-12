import { useEffect, useMemo, useState } from 'react';
import { obtenirBase } from '../donnees/base';
import type { PiloteSql } from '../donnees/pilote';
import { DepotBilanSql } from '../donnees/depot-bilan';
import { DepotParametresSql, type Reglages } from '../donnees/depot-parametres';
import { DepotPlanSql } from '../donnees/depot-plan';
import { DepotSuiviSql, type Journee } from '../donnees/depot-suivi';
import { calculerStatistiques, type StatistiquesConstance } from '../domaine/constance';
import { aujourdhuiLocal } from '../domaine/dates';
import type { Bilan, Plan, SaisiePlan } from '../domaine/types';
import { Demarrage } from './ecrans/Demarrage';
import { EcranBilan } from './ecrans/Bilan';
import { EcranJour } from './ecrans/Jour';
import { EcranPlan } from './ecrans/Plan';
import { EcranReglages } from './ecrans/Reglages';
import { EcranSuivi } from './ecrans/Suivi';

type Etape = 'chargement' | 'demarrage' | 'bilan' | 'plan' | 'jour' | 'suivi' | 'reglages';

export function App() {
  const [pilote, setPilote] = useState<PiloteSql | null>(null);
  const [etape, setEtape] = useState<Etape>('chargement');
  const [bilan, setBilan] = useState<Bilan | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [journee, setJournee] = useState<Journee | null>(null);
  const [statistiques, setStatistiques] = useState<StatistiquesConstance | null>(null);
  const [erreur, setErreur] = useState('');

  const depotBilan = useMemo(() => (pilote ? new DepotBilanSql(pilote) : null), [pilote]);

  async function chargerJournee(base: PiloteSql, planActif: Plan) {
    const suivi = new DepotSuiviSql(base, () => aujourdhuiLocal());
    const date = aujourdhuiLocal();
    setPlan(planActif);
    setJournee(await suivi.journee(date));
    setEtape('jour');
  }

  useEffect(() => {
    (async () => {
      const base = await obtenirBase();
      setPilote(base);
      const reglages = await new DepotParametresSql(base).lire();
      if (!reglages) {
        setEtape('demarrage');
        return;
      }
      const depot = new DepotBilanSql(base);
      const courant = (await depot.bilanCourant()) ?? (await depot.creerBrouillon());
      setBilan(courant);
      if (courant.statut !== 'gele') {
        setEtape('bilan');
        return;
      }
      const planActif = await new DepotPlanSql(base, () => aujourdhuiLocal()).planActif();
      if (!planActif) {
        setEtape('plan');
        return;
      }
      await chargerJournee(base, planActif);
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
      setEtape('plan');
      setErreur('');
    } catch (e) {
      setErreur(`La clôture du bilan a échoué : ${String(e)}. Vos réponses restent enregistrées, réessayez.`);
    }
  }

  async function creerPlan(saisie: SaisiePlan) {
    const planCree = await new DepotPlanSql(pilote!, () => aujourdhuiLocal()).creerDepuisBilanGele(saisie);
    await chargerJournee(pilote!, planCree);
  }

  async function rafraichirJournee() {
    setJournee(await new DepotSuiviSql(pilote!, () => aujourdhuiLocal()).journee(aujourdhuiLocal()));
  }

  async function cocher(occurrenceId: string, faite: boolean) {
    await new DepotSuiviSql(pilote!, () => aujourdhuiLocal()).cocherOccurrence(occurrenceId, faite);
    await rafraichirJournee();
  }

  async function cloturer(humeur: number | null, note: string) {
    await new DepotSuiviSql(pilote!, () => aujourdhuiLocal()).cloturerJournee(aujourdhuiLocal(), humeur, note);
    await rafraichirJournee();
  }

  async function afficherSuivi() {
    const depotPlan = new DepotPlanSql(pilote!, () => aujourdhuiLocal());
    const depotSuivi = new DepotSuiviSql(pilote!, () => aujourdhuiLocal());
    const actif = plan ?? await depotPlan.planActif();
    const occurrences = actif ? await depotPlan.occurrences(actif.id) : [];
    const journaux = await depotSuivi.journaux();
    setStatistiques(calculerStatistiques(journaux, occurrences, aujourdhuiLocal()));
    setEtape('suivi');
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
  if (etape === 'plan' && bilan) return <EcranPlan bilanId={bilan.id} onCreer={creerPlan} />;
  if (etape === 'jour' && journee) return (
    <EcranJour journee={journee} onCocher={cocher} onCloturer={cloturer} onSuivi={afficherSuivi} />
  );
  if (etape === 'suivi' && statistiques) return <EcranSuivi statistiques={statistiques} onRetour={() => setEtape('jour')} />;
  if (etape === 'reglages') return <EcranReglages pilote={pilote} onRetour={() => setEtape(plan ? 'jour' : 'plan')} />;

  return <p>Chargement…</p>;
}
