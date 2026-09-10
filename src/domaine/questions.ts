import type { Question, Section } from './types';

export const VERSION_CATALOGUE = 1;

function q(
  code: string,
  section: Section,
  groupe: number,
  intitule: string,
  type: Question['type'] = 'texte_long',
  aide?: string,
  obligatoire = false,
): Omit<Question, 'ordre'> {
  return { code, section, groupe, intitule, type, aide, obligatoire };
}

const PERSONNEL: Omit<Question, 'ordre'>[] = [
  q('p_nom', 'personnel', 1, 'Quels sont vos nom et prénoms ?', 'texte_court', undefined, true),
  q('p_naissance', 'personnel', 1, 'Quelle est votre date de naissance ?', 'texte_court', 'Format JJ/MM/AAAA', true),
  q('p_famille', 'personnel', 1, 'Quelle est votre situation familiale ?', 'texte_court'),
  q('p_etudes', 'personnel', 1, 'Quelles études universitaires avez-vous suivies ?', 'texte_court'),
  q('p_niveau', 'personnel', 1, "Quel est votre niveau d'étude ?", 'texte_court'),
  q('p_profession', 'personnel', 1, 'Quelle est votre profession ?', 'texte_court'),
  q('p_dernier_poste', 'personnel', 1, 'Quel est le dernier poste que vous avez occupé ?', 'texte_court'),
  q('p_aime', 'personnel', 1, "Qu'est-ce que vous aimez ?"),
  q('p_aime_pas', 'personnel', 1, "Qu'est-ce que vous n'aimez pas ?"),
  q('p_plaisir', 'personnel', 1, 'Qu\'est-ce qui vous fait plaisir dans la vie ?'),
  q('p_interets', 'personnel', 1, "Quels sont vos différents centres d'intérêt ?"),
  q('p_loisirs', 'personnel', 1, 'Quels sont vos loisirs préférés ?'),
  q('p_defauts', 'personnel', 1, 'Quels sont vos défauts ?'),
  q('p_qualites', 'personnel', 1, 'Quelles sont vos qualités ?'),
  q('p_valeurs', 'personnel', 1, 'Quelles sont vos valeurs ?'),
  q('p_ambitions', 'personnel', 1, 'Quelles sont vos ambitions ?', 'texte_long', 'Distinguez les ambitions personnelles des ambitions professionnelles.'),
  q('p_vision', 'personnel', 1, 'Quelle est la vision principale que vous avez pour votre vie ?'),
  q('p_reussite', 'personnel', 1, 'Quel est, selon vous, le profil parfait de réussite ?'),
  q('p_bonheur', 'personnel', 1, 'Quelle définition donnez-vous au bonheur ?'),
  q('p_peur', 'personnel', 1, 'De quoi avez-vous le plus peur dans la vie ?'),
  q('p_peurs_surmontees', 'personnel', 1, 'Quelles sont les peurs que vous avez déjà réussi à surmonter ?'),
  q('p_phobies', 'personnel', 1, 'Quelles sont vos phobies actuelles ?'),
  q('p_passion', 'personnel', 2, 'Quelle est votre passion ?', 'texte_long', "Ce que vous aimez faire au quotidien avec intérêt, engagement et bonheur. Avoir plusieurs passions est normal."),
  q('p_vision_terre', 'personnel', 3, 'Quelle est votre vision de la vie sur Terre ?', 'texte_long', 'Êtes-vous ici pour gagner de l\'argent, pour être utile à la communauté, pour autre chose ?'),
  q('p_metier_reve', 'personnel', 4, 'Quel est votre métier de rêve, et pourquoi ce choix ?'),
  q('p_engagement', 'personnel', 5, 'Comment mesurez-vous votre niveau d\'engagement dans vos projets personnels ?'),
  q('p_50000', 'personnel', 5, 'Vous avez besoin de 50 000 francs CFA pour un besoin pressant. Que faites-vous ?'),
  q('p_objectifs_quotidien', 'personnel', 6, 'Que faites-vous au quotidien pour répondre à vos ambitions ?', 'texte_long', 'Vous fixez-vous des objectifs ? Que faites-vous pour les atteindre ?'),
  q('p_difficultes', 'personnel', 7, 'En cas de difficulté durable, abandonnez-vous ou testez-vous d\'autres possibilités ?'),
  q('p_echec', 'personnel', 8, 'Quelle est votre compréhension de l\'échec ?', 'texte_long', 'À quel moment peut-on dire qu\'une personne a échoué ?'),
  q('p_remise_en_question', 'personnel', 9, 'Êtes-vous capable de vous remettre en question ?'),
  q('p_incredules', 'personnel', 10, 'Comment réagissez-vous face à ceux qui ne croient pas en vous ?'),
  q('p_modeles', 'personnel', 11, 'Avez-vous des modèles, mentors ou références ? Lesquels, et pourquoi eux ?'),
  q('p_a_travailler', 'personnel', 11, 'Quels sont les points sur lesquels vous devez travailler ?'),
];

const PROFESSIONNEL: Omit<Question, 'ordre'>[] = [
  q('pro_academique', 'professionnel', 1, 'Décrivez votre parcours académique et vos trois derniers diplômes.'),
  q('pro_parcours', 'professionnel', 2, 'Décrivez votre parcours professionnel des cinq dernières années.'),
  q('pro_poste', 'professionnel', 3, 'Quel poste occupez-vous actuellement ? Décrivez-le.'),
  q('pro_competences_formation', 'professionnel', 4, 'Quelles compétences techniques tenez-vous de votre formation de base ?'),
  q('pro_competences_emploi', 'professionnel', 5, 'Quelles compétences techniques tenez-vous de votre activité actuelle ?'),
  q('pro_annexes_formation', 'professionnel', 6, 'Quelles compétences complémentaires tenez-vous de votre formation ?'),
  q('pro_annexes_emploi', 'professionnel', 7, 'Quelles compétences complémentaires tenez-vous de votre activité actuelle ?'),
  q('pro_projet', 'professionnel', 9, 'Avez-vous un projet professionnel ? Décrivez-en les grandes lignes.'),
  q('pro_plan_carriere', 'professionnel', 10, 'Quel est votre plan de carrière ?'),
  q('pro_superieur', 'professionnel', 11, 'Qui êtes-vous selon votre supérieur hiérarchique ?'),
  q('pro_collegues', 'professionnel', 12, 'Qui êtes-vous selon vos collègues ?'),
  q('pro_externes', 'professionnel', 13, 'Qui êtes-vous selon les acteurs externes de votre entreprise ?'),
  q('pro_satisfaction', 'professionnel', 14, 'Êtes-vous satisfait de votre situation professionnelle actuelle ? Pourquoi ?'),
  q('pro_qualifications_suffisantes', 'professionnel', 15, 'Vos qualifications actuelles permettent-elles votre plan de carrière ?'),
  q('pro_qualifications_requises', 'professionnel', 16, 'Quelles qualifications sont requises pour atteindre vos objectifs ?'),
  q('pro_qualifications_possedees', 'professionnel', 17, 'Lesquelles possédez-vous déjà ?'),
  q('pro_qualifications_manquantes', 'professionnel', 18, 'Lesquelles vous manquent aujourd\'hui ?'),
  q('pro_fiertes', 'professionnel', 19, 'De quelles réalisations professionnelles de l\'année écoulée êtes-vous fier ?'),
  q('pro_reproches', 'professionnel', 20, 'Que vous reprochez-vous sur le plan professionnel cette année ?'),
];

function numeroter(questions: Omit<Question, 'ordre'>[]): Question[] {
  return questions.map((question, index) => ({ ...question, ordre: index + 1 }));
}

export const QUESTIONS: Question[] = [
  ...numeroter(PERSONNEL),
  ...numeroter(PROFESSIONNEL),
];

export function questionsDeSection(section: Section): Question[] {
  return QUESTIONS.filter((question) => question.section === section);
}
