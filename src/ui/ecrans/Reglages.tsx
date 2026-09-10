import { useState } from 'react';
import type { PiloteSql } from '../../donnees/pilote';
import { exporterTout, supprimerTout } from '../../donnees/export';

function dateDuJourLocale(): string {
  const maintenant = new Date();
  const mois = String(maintenant.getMonth() + 1).padStart(2, '0');
  const jour = String(maintenant.getDate()).padStart(2, '0');
  return `${maintenant.getFullYear()}-${mois}-${jour}`;
}

function telechargerDansLeNavigateur(nomFichier: string, contenu: string): void {
  const lien = document.createElement('a');
  lien.href = URL.createObjectURL(new Blob([contenu], { type: 'application/json' }));
  lien.download = nomFichier;
  lien.click();
}

export function EcranReglages({ pilote, onRetour }: { pilote: PiloteSql; onRetour(): void }) {
  const [message, setMessage] = useState('');
  const [confirmation, setConfirmation] = useState(false);

  async function exporter() {
    const contenu = await exporterTout(pilote);
    const nomFichier = `childeric-export-${dateDuJourLocale()}.json`;
    const { Capacitor } = await import('@capacitor/core');

    if (Capacitor.isNativePlatform()) {
      try {
        const { Filesystem, Directory, Encoding } = await import('@capacitor/filesystem');
        const resultat = await Filesystem.writeFile({
          path: nomFichier,
          data: contenu,
          directory: Directory.Documents,
          encoding: Encoding.UTF8,
        });
        setMessage(`Export écrit dans ${resultat.uri}`);
      } catch (erreur) {
        setMessage(
          `Échec de l'export : ${String(erreur)}. Vos données n'ont PAS été sauvegardées, ne supprimez rien.`,
        );
      }
      return;
    }

    telechargerDansLeNavigateur(nomFichier, contenu);
    setMessage('Export téléchargé.');
  }

  async function supprimer() {
    await supprimerTout(pilote);
    setConfirmation(false);
    setMessage('Toutes vos données ont été supprimées.');
  }

  return (
    <main>
      <h2>Réglages</h2>
      <p>Vos données sont stockées uniquement sur ce téléphone.</p>

      <button type="button" onClick={exporter}>Exporter mes données</button>

      {confirmation ? (
        <div>
          <p>Cette suppression est définitive. Exportez d'abord si vous voulez garder une trace.</p>
          <button type="button" onClick={supprimer}>Oui, tout supprimer</button>
          <button type="button" onClick={() => setConfirmation(false)}>Annuler</button>
        </div>
      ) : (
        <button type="button" onClick={() => setConfirmation(true)}>Supprimer toutes mes données</button>
      )}

      {message && <p role="status">{message}</p>}

      <button type="button" onClick={onRetour}>Retour</button>
    </main>
  );
}
