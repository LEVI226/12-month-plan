import { extraireLignes } from '../../src/donnees/conversion';

test('convertit un résultat Capacitor en tableau de lignes', () => {
  const lignes = extraireLignes({ values: [{ a: 1 }, { a: 2 }] });
  expect(lignes).toEqual([{ a: 1 }, { a: 2 }]);
});

test('renvoie un tableau vide quand Capacitor ne renvoie rien', () => {
  expect(extraireLignes({})).toEqual([]);
});
