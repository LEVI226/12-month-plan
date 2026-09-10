import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DepotBilanMemoire } from '../doubles/depot-bilan-memoire';
import { EcranBilan } from '../../src/ui/ecrans/Bilan';
import { QUESTIONS } from '../../src/domaine/questions';

async function contexte() {
  const depot = new DepotBilanMemoire();
  const bilan = await depot.creerBrouillon();
  return { depot, bilan };
}

test('affiche la première question du catalogue', async () => {
  const { depot, bilan } = await contexte();
  render(<EcranBilan depot={depot} bilan={bilan} onTermine={vi.fn()} />);
  expect(await screen.findByText(QUESTIONS[0].intitule)).toBeInTheDocument();
});

test('enregistre la réponse et avance à la question suivante', async () => {
  const { depot, bilan } = await contexte();
  render(<EcranBilan depot={depot} bilan={bilan} onTermine={vi.fn()} />);
  await screen.findByText(QUESTIONS[0].intitule);

  await userEvent.type(screen.getByLabelText('Votre réponse'), 'Yannick Ulrich');
  await userEvent.click(screen.getByRole('button', { name: 'Suivant' }));

  expect(await screen.findByText(QUESTIONS[1].intitule)).toBeInTheDocument();
  await waitFor(async () => {
    expect((await depot.reponses(bilan.id))[QUESTIONS[0].code]).toBe('Yannick Ulrich');
  });
});

test('reprend à la première question sans réponse', async () => {
  const { depot, bilan } = await contexte();
  await depot.repondre(bilan.id, QUESTIONS[0].code, 'déjà répondu');
  render(<EcranBilan depot={depot} bilan={bilan} onTermine={vi.fn()} />);
  expect(await screen.findByText(QUESTIONS[1].intitule)).toBeInTheDocument();
});

test('affiche la progression', async () => {
  const { depot, bilan } = await contexte();
  render(<EcranBilan depot={depot} bilan={bilan} onTermine={vi.fn()} />);
  expect(await screen.findByText(`1 / ${QUESTIONS.length}`)).toBeInTheDocument();
});

test('appelle onTermine à la dernière question', async () => {
  const { depot, bilan } = await contexte();
  for (const question of QUESTIONS.slice(0, -1)) {
    await depot.repondre(bilan.id, question.code, 'x');
  }
  const onTermine = vi.fn();
  render(<EcranBilan depot={depot} bilan={bilan} onTermine={onTermine} />);
  await screen.findByText(QUESTIONS[QUESTIONS.length - 1].intitule);
  await userEvent.type(screen.getByLabelText('Votre réponse'), 'dernière');
  await userEvent.click(screen.getByRole('button', { name: 'Terminer' }));
  await waitFor(() => expect(onTermine).toHaveBeenCalled());
});
