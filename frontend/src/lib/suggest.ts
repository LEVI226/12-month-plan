// Local, rule-based plan suggestion built purely from the bilan answers
// already stored on the device. This fallback makes no network call.
// The result is only a starting point the user can freely
// edit before creating the actual plan.

export interface SuggestedAction {
  title: string;
  days: number[]; // Monday=0 ... Sunday=6
}

export interface SuggestedObjective {
  title: string;
  actions: SuggestedAction[];
}

export interface SuggestedPlan {
  ambition: string;
  objectives: SuggestedObjective[];
}

function snippet(raw: string | undefined, max = 46): string {
  if (!raw) return '';
  const clean = raw.trim().replace(/\s+/g, ' ');
  if (!clean) return '';
  const firstSentence = clean.split(/[.!?\n]/)[0].trim();
  const base = firstSentence.length > 4 ? firstSentence : clean;
  return base.length > max ? `${base.slice(0, max - 1).trimEnd()}…` : base;
}

export function hasAnyAnswer(answers: Record<string, string>): boolean {
  return Object.values(answers).some((v) => v && v.trim().length > 0);
}

export function suggestPlan(answers: Record<string, string>): SuggestedPlan {
  const a = (id: string) => answers[id]?.trim();

  const ambitionSource = a('p_ambitions') || a('p_vision') || a('pro_carriere') || a('p_metier_reve');
  const ambition = ambitionSource
    ? snippet(ambitionSource, 90)
    : "Avancer un petit pas après l'autre, sans me juger";

  const personalActions: SuggestedAction[] = [];
  if (a('p_loisirs')) {
    personalActions.push({ title: `Prendre du temps pour : ${snippet(a('p_loisirs'), 42)}`, days: [1, 5] });
  }
  if (a('p_plaisir')) {
    personalActions.push({ title: `Un moment plaisir : ${snippet(a('p_plaisir'), 42)}`, days: [3] });
  }
  if (!personalActions.length) {
    personalActions.push({ title: 'Noter un moment de gratitude', days: [0, 2, 4] });
  }

  const proActions: SuggestedAction[] = [];
  if (a('pro_qualifications_manquantes')) {
    proActions.push({ title: `Étudier pendant 20 minutes : ${snippet(a('pro_qualifications_manquantes'), 42)}`, days: [1, 4] });
  }
  if (a('pro_projet')) {
    proActions.push({ title: `Avancer mon projet : ${snippet(a('pro_projet'), 42)}`, days: [2] });
  }
  if (!proActions.length) {
    proActions.push({ title: 'Envoyer une candidature ou relancer un contact', days: [1, 4] });
  }

  return {
    ambition,
    objectives: [
      {
        title: a('p_ambitions') ? 'Mon équilibre personnel' : 'Prendre soin de moi au quotidien',
        actions: personalActions.slice(0, 3),
      },
      {
        title: a('pro_carriere') || a('pro_projet') ? 'Avancer mon projet professionnel' : 'Mon projet professionnel',
        actions: proActions.slice(0, 2),
      },
    ],
  };
}
