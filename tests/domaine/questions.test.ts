import { QUESTIONS, VERSION_CATALOGUE, questionsDeSection } from '../../src/domaine/questions';

test('les codes de question sont uniques', () => {
  const codes = QUESTIONS.map((q) => q.code);
  expect(new Set(codes).size).toBe(codes.length);
});

test('les deux sections sont peuplées', () => {
  expect(questionsDeSection('personnel').length).toBeGreaterThan(10);
  expect(questionsDeSection('professionnel').length).toBeGreaterThan(10);
});

test('chaque section est ordonnée sans trou', () => {
  for (const section of ['personnel', 'professionnel'] as const) {
    const ordres = questionsDeSection(section).map((q) => q.ordre);
    expect(ordres).toEqual([...Array(ordres.length).keys()].map((i) => i + 1));
  }
});

test('le catalogue est versionné', () => {
  expect(VERSION_CATALOGUE).toBe(1);
});
