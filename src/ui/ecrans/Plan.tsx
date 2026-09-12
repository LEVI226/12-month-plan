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

interface ActionFormulaire {
  titre: string;
  jours: number[];
}

interface ObjectifFormulaire {
  titre: string;
  actions: ActionFormulaire[];
}

const objectifVide = (): ObjectifFormulaire => ({ titre: '', actions: [{ titre: '', jours: [] }] });

export function EcranPlan({ bilanId, onCreer }: { bilanId: string; onCreer(saisie: SaisiePlan): Promise<void> | void }) {
  const [ambition, setAmbition] = useState('');
  const [objectifs, setObjectifs] = useState<ObjectifFormulaire[]>([objectifVide()]);
  const [erreur, setErreur] = useState('');

  function modifierObjectif(indexObjectif: number, titre: string) {
    setObjectifs((actuels) => actuels.map((objectif, index) => (
      index === indexObjectif ? { ...objectif, titre } : objectif
    )));
  }

  function modifierAction(indexObjectif: number, indexAction: number, titre: string) {
    setObjectifs((actuels) => actuels.map((objectif, index) => {
      if (index !== indexObjectif) return objectif;
      return {
        ...objectif,
        actions: objectif.actions.map((action, actionIndex) => (
          actionIndex === indexAction ? { ...action, titre } : action
        )),
      };
    }));
  }

  function basculerJour(indexObjectif: number, indexAction: number, jour: number) {
    setObjectifs((actuels) => actuels.map((objectif, index) => {
      if (index !== indexObjectif) return objectif;
      return {
        ...objectif,
        actions: objectif.actions.map((action, actionIndex) => {
          if (actionIndex !== indexAction) return action;
          const jours = action.jours.includes(jour)
            ? action.jours.filter((valeur) => valeur !== jour)
            : [...action.jours, jour].sort();
          return { ...action, jours };
        }),
      };
    }));
  }

  function ajouterObjectif() {
    setObjectifs((actuels) => actuels.length >= 3 ? actuels : [...actuels, objectifVide()]);
  }

  function ajouterAction(indexObjectif: number) {
    setObjectifs((actuels) => actuels.map((objectif, index) => (
      index === indexObjectif
        ? { ...objectif, actions: [...objectif.actions, { titre: '', jours: [] }] }
        : objectif
    )));
  }

  async function creer() {
    const saisie = {
      bilanId,
      ambition: ambition.trim(),
      objectifs: objectifs.map((objectif) => ({
        titre: objectif.titre.trim(),
        actions: objectif.actions.map((action) => ({ titre: action.titre.trim(), jours: action.jours })),
      })),
    };

    const invalide = !saisie.ambition || saisie.objectifs.some((objectif) => (
      !objectif.titre || objectif.actions.length === 0 || objectif.actions.some((action) => !action.titre || action.jours.length === 0)
    ));
    if (invalide) {
      setErreur('Renseignez une ambition, un objectif, une action et au moins un jour.');
      return;
    }

    setErreur('');
    await onCreer(saisie);
  }

  return (
    <main>
      <h1>Construire mon plan</h1>
      <label htmlFor="ambition">Ambition annuelle</label>
      <textarea id="ambition" value={ambition} onChange={(e) => setAmbition(e.target.value)} />

      {objectifs.map((objectif, indexObjectif) => (
        <section key={indexObjectif}>
          <label htmlFor={`objectif-${indexObjectif}`}>Objectif {indexObjectif + 1}</label>
          <input
            id={`objectif-${indexObjectif}`}
            value={objectif.titre}
            onChange={(e) => modifierObjectif(indexObjectif, e.target.value)}
          />

          {objectif.actions.map((action, indexAction) => (
            <fieldset key={indexAction}>
              <legend>Action {indexObjectif + 1}.{indexAction + 1}</legend>
              <label htmlFor={`action-${indexObjectif}-${indexAction}`}>Action {indexObjectif + 1}.{indexAction + 1}</label>
              <input
                id={`action-${indexObjectif}-${indexAction}`}
                value={action.titre}
                onChange={(e) => modifierAction(indexObjectif, indexAction, e.target.value)}
              />

              <fieldset>
                <legend>Jours prévus</legend>
                {JOURS.map(([valeur, libelle]) => (
                  <label key={valeur}>
                    <input
                      type="checkbox"
                      checked={action.jours.includes(valeur)}
                      onChange={() => basculerJour(indexObjectif, indexAction, valeur)}
                    />
                    {libelle}
                  </label>
                ))}
              </fieldset>
            </fieldset>
          ))}

          <button type="button" onClick={() => ajouterAction(indexObjectif)}>
            Ajouter une action à l objectif {indexObjectif + 1}
          </button>
        </section>
      ))}

      {objectifs.length < 3 && <button type="button" onClick={ajouterObjectif}>Ajouter un objectif</button>}

      {erreur && <p role="alert">{erreur}</p>}
      <button type="button" onClick={creer}>Créer mon plan</button>
    </main>
  );
}
