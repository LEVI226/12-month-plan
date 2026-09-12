import type { StatistiquesConstance } from '../../domaine/constance';

export function EcranSuivi({ statistiques, onRetour }: { statistiques: StatistiquesConstance; onRetour(): void }) {
  return (
    <main>
      <h1>Suivi</h1>
      <p>{statistiques.joursClotures} jours clôturés</p>
      <p>{statistiques.actionsFaites} actions faites</p>
      <p>{statistiques.actionsManquees} actions manquées</p>
      <p>Humeur moyenne {statistiques.humeurMoyenne ?? '-'} / 5</p>
      <p>Série actuelle {statistiques.serie} jours</p>
      <button type="button" onClick={onRetour}>Retour</button>
    </main>
  );
}
