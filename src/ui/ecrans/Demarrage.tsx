import { useState } from 'react';
import type { Reglages } from '../../donnees/depot-parametres';

export function fuseauDeLAppareil(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Africa/Ouagadougou';
}

export function Demarrage({ onValider }: { onValider(reglages: Reglages): void }) {
  const [prenom, setPrenom] = useState('');
  const [heureRappel, setHeureRappel] = useState('20:00');
  const fuseau = fuseauDeLAppareil();

  function valider() {
    if (prenom.trim() === '') return;
    onValider({ prenom: prenom.trim(), fuseau, heureRappel });
  }

  return (
    <main>
      <h1>Bienvenue</h1>
      <p>Trois questions, puis on commence. Aucune donnée ne quitte ce téléphone.</p>

      <label htmlFor="prenom">Votre prénom</label>
      <input id="prenom" value={prenom} onChange={(e) => setPrenom(e.target.value)} />

      <label htmlFor="heure">Heure de votre point quotidien</label>
      <input id="heure" type="time" value={heureRappel} onChange={(e) => setHeureRappel(e.target.value)} />

      <p>Fuseau détecté : {fuseau}</p>

      <button type="button" onClick={valider}>Commencer</button>
    </main>
  );
}
