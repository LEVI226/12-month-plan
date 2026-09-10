import { render, screen } from '@testing-library/react';
import { App } from '../../src/ui/App';

vi.mock('../../src/donnees/base', () => ({
  obtenirBase: async () => ({
    executer: async () => {},
    lire: async () => [],
  }),
}));

test("propose le premier lancement quand aucun réglage n'existe", async () => {
  render(<App />);
  expect(await screen.findByRole('heading', { name: 'Bienvenue' })).toBeInTheDocument();
});
