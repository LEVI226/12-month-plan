import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Demarrage } from '../../src/ui/ecrans/Demarrage';

test('ne valide pas tant que le prénom est vide', async () => {
  const onValider = vi.fn();
  render(<Demarrage onValider={onValider} />);
  await userEvent.click(screen.getByRole('button', { name: 'Commencer' }));
  expect(onValider).not.toHaveBeenCalled();
});

test('remonte les réglages saisis', async () => {
  const onValider = vi.fn();
  render(<Demarrage onValider={onValider} />);
  await userEvent.type(screen.getByLabelText('Votre prénom'), 'Yannick');
  await userEvent.clear(screen.getByLabelText('Heure de votre point quotidien'));
  await userEvent.type(screen.getByLabelText('Heure de votre point quotidien'), '20:00');
  await userEvent.click(screen.getByRole('button', { name: 'Commencer' }));
  expect(onValider).toHaveBeenCalledWith(
    expect.objectContaining({ prenom: 'Yannick', heureRappel: '20:00' }),
  );
});
