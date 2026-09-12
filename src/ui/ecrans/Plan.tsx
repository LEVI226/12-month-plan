import { useState } from 'react';
import type { SaisiePlan } from '../../domaine/types';

const JOURS = [
  [1, 'Lundi'],
  [2, 'Mardi'],
  [3, 'Mercredi'],
  [4, 'Jeudi'],
  [5, 'Vendredi'],
  [6, 'Samedi'],
  [7, 'Dimanche'],
] as const;

export function EcranPlan({ bilanId, onCreer }: { bilanId: string; onCreer(saisie: SaisiePlan): Promise<void> | void }) {
  const [ambition, setAmbition] = useState('');
  const [objectif, setObjectif] = useState('');
  const [action, setAction] = useState('');
  const [jours, setJours] = useState<number[]>([]);
  const [erreur, setErreur] = useState('');

  function basculerJour(jour: number) {
    setJours((actuels) => actuels.includes(jour) ? actuels.filter((j) => j !== jour) : [...actuels, jour].sort());
  }

  async function creer() {
    if (!ambition.trim() || !objectif.trim() || !action.trim() || jours.length === 0) {
      setErreur('Renseignez une ambition, un objectif, une action et au moins un jour.');
      return;
    }
    setErreur('');
    await onCreer({
      bilanId,
      ambition: ambition.trim(),
      objectifs: [{ titre: objectif.trim(), actions: [{ titre: action.trim(), jours }] }],
    });
  }

  return (
    <main>
      <h1>Construire mon plan</h1>
      <label htmlFor="ambition">Ambition annuelle</label>
      <textarea id="ambition" value={ambition} onChange={(e) => setAmbition(e.target.value)} />

      <label htmlFor="objectif1">Objectif 1</label>
      <input id="objectif1" value={objectif} onChange={(e) => setObjectif(e.target.value)} />

      <label htmlFor="action1">Action 1</label>
      <input id="action1" value={action} onChange={(e) => setAction(e.target.value)} />

      <fieldset>
        <legend>Jours prévus</legend>
        {JOURS.map(([valeur, libelle]) => (
          <label key={valeur}>
            <input type="checkbox" checked={jours.includes(valeur)} onChange={() => basculerJour(valeur)} />
            {libelle}
          </label>
        ))}
      </fieldset>

      {erreur && <p role="alert">{erreur}</p>}
      <button type="button" onClick={creer}>Créer mon plan</button>
    </main>
  );
}
