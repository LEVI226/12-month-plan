import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EcranPlan } from '../../src/ui/ecrans/Plan';

test('crée une saisie de plan manuel avec une action récurrente', async () => {
  const onCreer = vi.fn();
  render(<EcranPlan bilanId="b1" onCreer={onCreer} />);

  await userEvent.type(screen.getByLabelText('Ambition annuelle'), 'Tenir une direction claire');
  await userEvent.type(screen.getByLabelText('Objectif 1'), 'Écrire');
  await userEvent.type(screen.getByLabelText('Action 1.1'), 'Écrire 10 lignes');
  await userEvent.click(screen.getByLabelText('Lundi'));
  await userEvent.click(screen.getByLabelText('Mercredi'));
  await userEvent.click(screen.getByRole('button', { name: 'Créer mon plan' }));

  expect(onCreer).toHaveBeenCalledWith({
    bilanId: 'b1',
    ambition: 'Tenir une direction claire',
    objectifs: [{ titre: 'Écrire', actions: [{ titre: 'Écrire 10 lignes', jours: [1, 3] }] }],
  });
});

test('permet de créer plusieurs objectifs avec plusieurs actions', async () => {
  const onCreer = vi.fn();
  render(<EcranPlan bilanId="b1" onCreer={onCreer} />);

  await userEvent.type(screen.getByLabelText('Ambition annuelle'), 'Tenir une direction claire');
  await userEvent.type(screen.getByLabelText('Objectif 1'), 'Écrire');
  await userEvent.type(screen.getByLabelText('Action 1.1'), 'Écrire 10 lignes');
  await userEvent.click(screen.getByLabelText('Lundi'));

  await userEvent.click(screen.getByRole('button', { name: 'Ajouter une action à l objectif 1' }));
  await userEvent.type(screen.getByLabelText('Action 1.2'), 'Relire mes notes');
  await userEvent.click(screen.getAllByLabelText('Mardi')[1]);

  await userEvent.click(screen.getByRole('button', { name: 'Ajouter un objectif' }));
  await userEvent.type(screen.getByLabelText('Objectif 2'), 'Bouger');
  await userEvent.type(screen.getByLabelText('Action 2.1'), 'Marcher 30 minutes');
  await userEvent.click(screen.getAllByLabelText('Mercredi')[2]);

  await userEvent.click(screen.getByRole('button', { name: 'Créer mon plan' }));

  expect(onCreer).toHaveBeenCalledWith({
    bilanId: 'b1',
    ambition: 'Tenir une direction claire',
    objectifs: [
      {
        titre: 'Écrire',
        actions: [
          { titre: 'Écrire 10 lignes', jours: [1] },
          { titre: 'Relire mes notes', jours: [2] },
        ],
      },
      {
        titre: 'Bouger',
        actions: [{ titre: 'Marcher 30 minutes', jours: [3] }],
      },
    ],
  });
});

test('limite la saisie à trois objectifs', async () => {
  render(<EcranPlan bilanId="b1" onCreer={vi.fn()} />);

  await userEvent.click(screen.getByRole('button', { name: 'Ajouter un objectif' }));
  await userEvent.click(screen.getByRole('button', { name: 'Ajouter un objectif' }));

  expect(screen.getByLabelText('Objectif 3')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Ajouter un objectif' })).not.toBeInTheDocument();
});

test('demande au moins une ambition et une action', async () => {
  const onCreer = vi.fn();
  render(<EcranPlan bilanId="b1" onCreer={onCreer} />);
  await userEvent.click(screen.getByRole('button', { name: 'Créer mon plan' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Renseignez une ambition, un objectif, une action et au moins un jour.');
  expect(onCreer).not.toHaveBeenCalled();
});
