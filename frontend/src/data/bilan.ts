export type BilanPart = 'personnel' | 'professionnel';
export type BilanInputType = 'short' | 'long';

export interface BilanQuestion {
  id: string;
  part: BilanPart;
  section: string;
  label: string;
  help?: string;
  type: BilanInputType;
}

// Derived from the "Fiche bilan" template (11 personal themes / 20 professional
// questions), consolidated into a guided, sectioned interview.
export const BILAN_QUESTIONS: BilanQuestion[] = [
  // ---------- PERSONNEL ----------
  { id: 'p_nom', part: 'personnel', section: 'Identité', label: 'Nom et prénoms', type: 'short' },
  { id: 'p_naissance', part: 'personnel', section: 'Identité', label: 'Date de naissance (âge)', type: 'short' },
  { id: 'p_famille', part: 'personnel', section: 'Identité', label: 'Situation familiale', type: 'short' },
  { id: 'p_etudes', part: 'personnel', section: 'Identité', label: 'Études universitaires', type: 'short' },
  { id: 'p_niveau', part: 'personnel', section: 'Identité', label: "Niveau d'étude", type: 'short' },
  { id: 'p_profession', part: 'personnel', section: 'Identité', label: 'Profession', type: 'short' },
  { id: 'p_poste', part: 'personnel', section: 'Identité', label: 'Dernier poste occupé', type: 'short' },

  { id: 'p_aime', part: 'personnel', section: 'Ce qui vous anime', label: "Qu'est-ce que vous aimez ?", type: 'long' },
  { id: 'p_aimepas', part: 'personnel', section: 'Ce qui vous anime', label: "Qu'est-ce que vous n'aimez pas ?", type: 'long' },
  { id: 'p_plaisir', part: 'personnel', section: 'Ce qui vous anime', label: 'Qu\'est-ce qui vous fait plaisir dans la vie ?', type: 'long' },
  { id: 'p_interets', part: 'personnel', section: 'Ce qui vous anime', label: "Quels sont vos centres d'intérêt ?", type: 'long' },
  { id: 'p_loisirs', part: 'personnel', section: 'Ce qui vous anime', label: 'Quels sont vos loisirs préférés ?', type: 'long' },

  { id: 'p_qualites', part: 'personnel', section: 'Vous, en profondeur', label: 'Quelles sont vos qualités ?', type: 'long' },
  { id: 'p_defauts', part: 'personnel', section: 'Vous, en profondeur', label: 'Quels sont vos défauts ?', type: 'long' },
  { id: 'p_valeurs', part: 'personnel', section: 'Vous, en profondeur', label: 'Quelles sont vos valeurs ?', type: 'long' },
  { id: 'p_ambitions', part: 'personnel', section: 'Vous, en profondeur', label: 'Quelles sont vos ambitions ?', help: 'Distinguez vos ambitions personnelles de vos ambitions professionnelles.', type: 'long' },
  { id: 'p_vision', part: 'personnel', section: 'Vous, en profondeur', label: 'Quelle est la vision principale pour votre vie ?', type: 'long' },
  { id: 'p_reussite', part: 'personnel', section: 'Vous, en profondeur', label: 'Selon vous, quel est le profil parfait de réussite ?', type: 'long' },
  { id: 'p_bonheur', part: 'personnel', section: 'Vous, en profondeur', label: 'Quelle définition donnez-vous au bonheur ?', type: 'long' },
  { id: 'p_peurs', part: 'personnel', section: 'Vous, en profondeur', label: 'De quoi avez-vous le plus peur dans la vie ?', type: 'long' },
  { id: 'p_peurs_surmontees', part: 'personnel', section: 'Vous, en profondeur', label: 'Quelles peurs avez-vous déjà surmontées ?', type: 'long' },
  { id: 'p_phobies', part: 'personnel', section: 'Vous, en profondeur', label: 'Quelles sont vos phobies actuelles ?', type: 'long' },

  { id: 'p_passion', part: 'personnel', section: 'Passion & vision', label: 'Quelle est votre passion ?', help: 'Ce que vous aimez faire avec intérêt, engagement et bonheur. Plusieurs passions sont possibles.', type: 'long' },
  { id: 'p_vision_terre', part: 'personnel', section: 'Passion & vision', label: 'Quelle est votre vision de la vie sur Terre ?', help: 'Gagner sa vie, être utile à la communauté, exercer des responsabilités… partagez librement.', type: 'long' },
  { id: 'p_metier_reve', part: 'personnel', section: 'Passion & vision', label: 'Quel est votre métier de rêve, et pourquoi ?', type: 'long' },

  { id: 'p_engagement', part: 'personnel', section: "Rapport à l'action", label: 'Comment mesurez-vous votre engagement dans vos projets ?', type: 'long' },
  { id: 'p_quotidien', part: 'personnel', section: "Rapport à l'action", label: 'Que faites-vous au quotidien pour vos ambitions ?', help: 'Vous fixez-vous des objectifs ? Que faites-vous pour les atteindre ?', type: 'long' },
  { id: 'p_difficultes', part: 'personnel', section: "Rapport à l'action", label: 'Face à une difficulté durable, abandonner ou persévérer ?', type: 'long' },
  { id: 'p_echec', part: 'personnel', section: "Rapport à l'action", label: "Quelle est votre compréhension de l'échec ?", type: 'long' },
  { id: 'p_remise', part: 'personnel', section: "Rapport à l'action", label: 'Êtes-vous capable de vous remettre en question ?', type: 'long' },
  { id: 'p_sceptiques', part: 'personnel', section: "Rapport à l'action", label: 'Face à ceux qui ne croient pas en vous, quelle attitude ?', type: 'long' },
  { id: 'p_modeles', part: 'personnel', section: "Rapport à l'action", label: 'Avez-vous des modèles ou mentors ? Lesquels, et pourquoi ?', type: 'long' },

  // ---------- PROFESSIONNEL ----------
  { id: 'pro_academique', part: 'professionnel', section: 'Parcours', label: 'Décrivez votre parcours académique.', help: 'Citez vos 3 diplômes les plus récents.', type: 'long' },
  { id: 'pro_parcours', part: 'professionnel', section: 'Parcours', label: 'Votre parcours professionnel des 5 dernières années.', type: 'long' },
  { id: 'pro_poste', part: 'professionnel', section: 'Parcours', label: 'Quel poste occupez-vous actuellement ? Décrivez-le.', type: 'long' },

  { id: 'pro_tech_base', part: 'professionnel', section: 'Compétences', label: 'Compétences techniques liées à votre formation de base ?', type: 'long' },
  { id: 'pro_tech_emploi', part: 'professionnel', section: 'Compétences', label: 'Compétences techniques liées à votre emploi actuel ?', type: 'long' },
  { id: 'pro_annexe_base', part: 'professionnel', section: 'Compétences', label: 'Compétences annexes liées à votre formation ?', type: 'long' },
  { id: 'pro_annexe_emploi', part: 'professionnel', section: 'Compétences', label: 'Compétences annexes liées à votre emploi actuel ?', type: 'long' },

  { id: 'pro_projet', part: 'professionnel', section: 'Projet & carrière', label: 'Avez-vous un projet professionnel ? Grandes lignes.', type: 'long' },
  { id: 'pro_carriere', part: 'professionnel', section: 'Projet & carrière', label: 'Quel est votre plan de carrière ?', type: 'long' },
  { id: 'pro_qualif_requises', part: 'professionnel', section: 'Projet & carrière', label: 'Quelles qualifications sont requises pour ce plan ?', type: 'long' },
  { id: 'pro_qualif_possede', part: 'professionnel', section: 'Projet & carrière', label: 'Lesquelles possédez-vous actuellement ?', type: 'long' },
  { id: 'pro_qualif_manque', part: 'professionnel', section: 'Projet & carrière', label: 'Lesquelles vous manquent aujourd\'hui ?', type: 'long' },

  { id: 'pro_superieur', part: 'professionnel', section: 'Regard des autres', label: 'Qui êtes-vous selon votre supérieur ? Vos rapports ?', type: 'long' },
  { id: 'pro_collegues', part: 'professionnel', section: 'Regard des autres', label: 'Qui êtes-vous selon vos collègues ? Vos rapports ?', type: 'long' },
  { id: 'pro_externes', part: 'professionnel', section: 'Regard des autres', label: 'Qui êtes-vous selon les acteurs externes ? Vos rapports ?', type: 'long' },

  { id: 'pro_satisfaction', part: 'professionnel', section: 'Bilan & satisfaction', label: 'Êtes-vous satisfait(e) de votre situation actuelle ? Pourquoi ?', type: 'long' },
  { id: 'pro_qualif_suffisantes', part: 'professionnel', section: 'Bilan & satisfaction', label: 'Vos qualifications suffisent-elles pour votre plan de carrière ?', type: 'long' },
  { id: 'pro_realisations', part: 'professionnel', section: 'Bilan & satisfaction', label: 'Quelles réalisations récentes vous rendent fier(e) ?', type: 'long' },
  { id: 'pro_reproches', part: 'professionnel', section: 'Bilan & satisfaction', label: 'Que vous reprochez-vous récemment, côté professionnel ?', type: 'long' },
];

export interface BilanSection {
  key: string;
  part: BilanPart;
  title: string;
  from: number; // index of first question
  count: number;
}

export const BILAN_SECTIONS: BilanSection[] = (() => {
  const out: BilanSection[] = [];
  BILAN_QUESTIONS.forEach((q, i) => {
    const last = out[out.length - 1];
    if (!last || last.title !== q.section || last.part !== q.part) {
      out.push({ key: `${q.part}-${q.section}`, part: q.part, title: q.section, from: i, count: 1 });
    } else {
      last.count += 1;
    }
  });
  return out;
})();

export const PLAN_ACTION_EXAMPLES = [
  'Marcher 30 minutes',
  'Écrire 10 lignes',
  'Envoyer une candidature',
  'Lire 5 pages',
  'Appeler un contact professionnel',
];
