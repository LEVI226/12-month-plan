import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EcranSuivi } from '../../src/ui/ecrans/Suivi';

test('affiche les statistiques de constance', async () => {
  const onRetour = vi.fn();
  render(<EcranSuivi statistiques={{
    joursClotures: 5,
    actionsFaites: 12,
    actionsManquees: 3,
    humeurMoyenne: 4.2,
    serie: 3,
  }} onRetour={onRetour} />);

  expect(screen.getByText('5 jours clôturés')).toBeInTheDocument();
  expect(screen.getByText('12 actions faites')).toBeInTheDocument();
  expect(screen.getByText('3 actions manquées')).toBeInTheDocument();
  expect(screen.getByText('Humeur moyenne 4.2 / 5')).toBeInTheDocument();
  expect(screen.getByText('Série actuelle 3 jours')).toBeInTheDocument();

  await userEvent.click(screen.getByRole('button', { name: 'Retour' }));
  expect(onRetour).toHaveBeenCalled();
});
