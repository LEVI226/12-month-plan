import { useState } from 'react';
import type { Journee } from '../../donnees/depot-suivi';

interface Props {
  journee: Journee;
  onCocher(occurrenceId: string, faite: boolean): Promise<void> | void;
  onCloturer(humeur: number | null, note: string): Promise<void> | void;
  onSuivi(): void;
}

export function EcranJour({ journee, onCocher, onCloturer, onSuivi }: Props) {
  const visibles = journee.occurrences.slice(0, 6);
  const reste = Math.max(0, journee.occurrences.length - visibles.length);
  const [humeur, setHumeur] = useState<number | null>(journee.journal?.humeur ?? null);
  const [note, setNote] = useState(journee.journal?.note ?? '');

  return (
    <main>
      <h1>Aujourd'hui</h1>
      <p>{journee.date}</p>

      {visibles.map((occurrence) => (
        <label key={occurrence.id}>
          <input
            type="checkbox"
            checked={occurrence.statut === 'fait'}
            onChange={(e) => onCocher(occurrence.id, e.currentTarget.checked)}
            disabled={journee.cloturee}
          />
          {occurrence.titre}
        </label>
      ))}

      {reste > 0 && <p>{reste} action en plus reste hors de l écran du jour.</p>}

      <div aria-label="Humeur">
        {[1, 2, 3, 4, 5].map((valeur) => (
          <button type="button" key={valeur} aria-pressed={humeur === valeur} onClick={() => setHumeur(valeur)}>
            {valeur}
          </button>
        ))}
      </div>

      <label htmlFor="note">Note du jour</label>
      <textarea id="note" value={note} onChange={(e) => setNote(e.target.value)} />

      <button type="button" onClick={() => onCloturer(humeur, note)} disabled={journee.cloturee}>
        {journee.cloturee ? 'Journée clôturée' : 'Clôturer ma journée'}
      </button>
      <button type="button" onClick={onSuivi}>
        Suivi
      </button>
    </main>
  );
}
