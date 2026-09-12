function deuxChiffres(valeur: number): string {
  return String(valeur).padStart(2, '0');
}

function depuisDateCivile(date: string): Date {
  const [annee, mois, jour] = date.split('-').map(Number);
  return new Date(annee, mois - 1, jour);
}

export function aujourdhuiLocal(date = new Date()): string {
  return `${date.getFullYear()}-${deuxChiffres(date.getMonth() + 1)}-${deuxChiffres(date.getDate())}`;
}

export function ajouterJours(date: string, jours: number): string {
  const copie = depuisDateCivile(date);
  copie.setDate(copie.getDate() + jours);
  return aujourdhuiLocal(copie);
}

export function jourIso(date: string): number {
  const jour = depuisDateCivile(date).getDay();
  return jour === 0 ? 7 : jour;
}

export function datesSurSemaines(debut: string, semaines: number): string[] {
  return Array.from({ length: semaines * 7 }, (_, index) => ajouterJours(debut, index));
}
