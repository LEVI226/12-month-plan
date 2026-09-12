import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Journee } from '../../src/donnees/depot-suivi';
import { EcranJour } from '../../src/ui/ecrans/Jour';

function journee(): Journee {
  return {
    date: '2026-09-14',
    journal: null,
    cloturee: false,
    occurrences: Array.from({ length: 7 }, (_, index) => ({
      id: `o${index + 1}`,
      actionId: `a${index + 1}`,
      titre: `Action ${index + 1}`,
      datePrevue: '2026-09-14',
      statut: 'a_faire',
      faitLe: null,
      note: null,
    })),
  };
}

test('affiche au maximum six actions du jour', () => {
  render(<EcranJour journee={journee()} onCocher={vi.fn()} onCloturer={vi.fn()} onSuivi={vi.fn()} />);
  expect(screen.getByText('Action 1')).toBeInTheDocument();
  expect(screen.getByText('Action 6')).toBeInTheDocument();
  expect(screen.queryByText('Action 7')).not.toBeInTheDocument();
  expect(screen.getByText('1 action en plus reste hors de l écran du jour.')).toBeInTheDocument();
});

test('coche une action et clôture avec humeur et note', async () => {
  const onCocher = vi.fn();
  const onCloturer = vi.fn();
  render(<EcranJour journee={journee()} onCocher={onCocher} onCloturer={onCloturer} onSuivi={vi.fn()} />);

  await userEvent.click(screen.getByLabelText('Action 1'));
  expect(onCocher).toHaveBeenCalledWith('o1', true);

  await userEvent.click(screen.getByRole('button', { name: '4' }));
  await userEvent.type(screen.getByLabelText('Note du jour'), 'Bonne reprise');
  await userEvent.click(screen.getByRole('button', { name: 'Clôturer ma journée' }));

  expect(onCloturer).toHaveBeenCalledWith(4, 'Bonne reprise');
});
