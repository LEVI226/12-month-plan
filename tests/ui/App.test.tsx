/**
 * @vitest-environment node
 */

import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
// @ts-expect-error jsdom est déjà une dépendance de test, sans types dédiés dans ce projet.
import { JSDOM } from 'jsdom';
import { PiloteNode } from '../../src/donnees/pilote-node';
import { migrer } from '../../src/donnees/migrer';
import { DepotParametresSql } from '../../src/donnees/depot-parametres';
import { DepotBilanSql } from '../../src/donnees/depot-bilan';
import { DepotPlanSql } from '../../src/donnees/depot-plan';
import { App } from '../../src/ui/App';

let pilote: PiloteNode;
let dom: JSDOM;

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 8, 14, 12));
  dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost' });
  globalThis.window = dom.window as unknown as Window & typeof globalThis;
  globalThis.document = dom.window.document;
  Object.defineProperty(globalThis, 'navigator', { value: dom.window.navigator, configurable: true });
  globalThis.HTMLElement = dom.window.HTMLElement;
});

afterEach(() => {
  dom.window.close();
  vi.useRealTimers();
});

vi.mock('../../src/donnees/base', () => ({
  obtenirBase: async () => pilote,
}));

async function baseNeuve() {
  pilote = new PiloteNode();
  await migrer(pilote);
  return pilote;
}

test("propose le premier lancement quand aucun réglage n'existe", async () => {
  await baseNeuve();
  const vue = render(<App />);
  expect(await vue.findByRole('heading', { name: 'Bienvenue' })).toBeInTheDocument();
});

test('propose le plan quand le bilan est gelé sans plan actif', async () => {
  const base = await baseNeuve();
  await new DepotParametresSql(base).enregistrer({ prenom: 'Yannick', fuseau: 'Europe/Paris', heureRappel: '20:00' });
  const depotBilan = new DepotBilanSql(base, () => '2026-09-14');
  const bilan = await depotBilan.creerBrouillon();
  await depotBilan.geler(bilan.id);

  const vue = render(<App />);
  expect(await vue.findByRole('heading', { name: 'Construire mon plan' })).toBeInTheDocument();
});

test('affiche le jour quand un plan actif existe', async () => {
  const base = await baseNeuve();
  await new DepotParametresSql(base).enregistrer({ prenom: 'Yannick', fuseau: 'Europe/Paris', heureRappel: '20:00' });
  const depotBilan = new DepotBilanSql(base, () => '2026-09-14');
  const bilan = await depotBilan.creerBrouillon();
  await depotBilan.geler(bilan.id);
  await new DepotPlanSql(base, () => '2026-09-14').creerDepuisBilanGele({
    bilanId: bilan.id,
    ambition: 'Tenir une direction claire',
    objectifs: [{ titre: 'Écrire', actions: [{ titre: 'Écrire 10 lignes', jours: [1] }] }],
  });

  const vue = render(<App />);
  expect(await vue.findByRole('heading', { name: "Aujourd'hui" })).toBeInTheDocument();
  expect(vue.getByText('Écrire 10 lignes')).toBeInTheDocument();

  await userEvent.click(vue.getByRole('button', { name: 'Suivi' }));
  expect(await vue.findByRole('heading', { name: 'Suivi' })).toBeInTheDocument();
});
