/**
 * @vitest-environment node
 */

import { PiloteNode } from '../../src/donnees/pilote-node';
import { migrer } from '../../src/donnees/migrer';
import { DepotParametresSql } from '../../src/donnees/depot-parametres';

async function depotNeuf() {
  const pilote = new PiloteNode();
  await migrer(pilote);
  return new DepotParametresSql(pilote);
}

test('renvoie null tant que rien n\'a été enregistré', async () => {
  expect(await (await depotNeuf()).lire()).toBeNull();
});

test('enregistre puis relit les réglages', async () => {
  const depot = await depotNeuf();
  const reglages = { prenom: 'Yannick', fuseau: 'Africa/Ouagadougou', heureRappel: '20:00' };
  await depot.enregistrer(reglages);
  expect(await depot.lire()).toEqual(reglages);
});

test('un second enregistrement remplace le premier', async () => {
  const depot = await depotNeuf();
  await depot.enregistrer({ prenom: 'Yannick', fuseau: 'Africa/Ouagadougou', heureRappel: '20:00' });
  await depot.enregistrer({ prenom: 'Yannick', fuseau: 'Africa/Ouagadougou', heureRappel: '21:30' });
  expect((await depot.lire())?.heureRappel).toBe('21:30');
});
