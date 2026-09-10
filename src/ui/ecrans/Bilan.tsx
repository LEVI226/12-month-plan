import { useEffect, useState } from 'react';
import { QUESTIONS } from '../../domaine/questions';
import type { Bilan as BilanType } from '../../domaine/types';
import type { DepotBilan } from '../../donnees/depot-bilan';

interface Props {
  depot: DepotBilan;
  bilan: BilanType;
  onTermine(): void;
}

export function EcranBilan({ depot, bilan, onTermine }: Props) {
  const [index, setIndex] = useState<number | null>(null);
  const [valeur, setValeur] = useState('');
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    depot.reponses(bilan.id).then((reponses) => {
      const premierSansReponse = QUESTIONS.findIndex((q) => !reponses[q.code]);
      const depart = premierSansReponse === -1 ? QUESTIONS.length - 1 : premierSansReponse;
      setIndex(depart);
      setValeur(reponses[QUESTIONS[depart].code] ?? '');
    });
  }, [depot, bilan.id]);

  if (index === null) return <p>Chargement…</p>;

  const question = QUESTIONS[index];
  const derniere = index === QUESTIONS.length - 1;

  async function avancer() {
    try {
      await depot.repondre(bilan.id, question.code, valeur);
      if (derniere) {
        onTermine();
        return;
      }
      const suivant = index! + 1;
      const reponses = await depot.reponses(bilan.id);
      setIndex(suivant);
      setValeur(reponses[QUESTIONS[suivant].code] ?? '');
      setErreur('');
    } catch {
      setErreur('Votre réponse n\'a pas pu être enregistrée. Réessayez.');
    }
  }

  async function reculer() {
    try {
      await depot.repondre(bilan.id, question.code, valeur);
      const precedent = Math.max(0, index! - 1);
      const reponses = await depot.reponses(bilan.id);
      setIndex(precedent);
      setValeur(reponses[QUESTIONS[precedent].code] ?? '');
      setErreur('');
    } catch {
      setErreur('Votre réponse n\'a pas pu être enregistrée. Réessayez.');
    }
  }

  return (
    <main>
      <p>{`${index + 1} / ${QUESTIONS.length}`}</p>
      <h2>{question.intitule}</h2>
      {question.aide && <p>{question.aide}</p>}

      <label htmlFor="reponse">Votre réponse</label>
      {question.type === 'texte_court' ? (
        <input id="reponse" value={valeur} onChange={(e) => setValeur(e.target.value)} />
      ) : (
        <textarea id="reponse" rows={6} value={valeur} onChange={(e) => setValeur(e.target.value)} />
      )}

      {erreur && <p role="alert">{erreur}</p>}

      <div>
        {index > 0 && <button type="button" onClick={reculer}>Précédent</button>}
        <button type="button" onClick={avancer}>{derniere ? 'Terminer' : 'Suivant'}</button>
      </div>
    </main>
  );
}
