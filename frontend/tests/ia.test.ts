import { generer, generatePlan, parsePlan, RefusErreur } from '../src/lib/ia/client';
const plan = { ambition: 'Apprendre', objectives: [{ title: 'Lire', actions: [{ title: 'Lire 10 pages', days: [0, 2] }] }] };
afterEach(() => jest.restoreAllMocks());
test('valid fenced JSON remains editable data', () => {
  expect(parsePlan('```json\n' + JSON.stringify(plan) + '\n```')).toEqual(plan);
});
test.each([[[-1]], [[7]], [[1.5]], [[]], [[1, 1]]])('rejects invalid day list %j', (days) => {
  expect(() => parsePlan(JSON.stringify({ ...plan, objectives: [{ title: 'Lire', actions: [{ title: 'Lire', days }] }] }))).toThrow();
});
test('invalid schema retries only once', async () => {
  const request = jest.fn(async () => '{}');
  await expect(generatePlan(request, 'answers')).rejects.toThrow();
  expect(request).toHaveBeenCalledTimes(2);
});
test('refusal never retries', async () => {
  const request = jest.fn(async () => { throw new RefusErreur(); });
  await expect(generatePlan(request, 'answers')).rejects.toBeInstanceOf(RefusErreur);
  expect(request).toHaveBeenCalledTimes(1);
});
test.each(['Claude', 'ChatGPT'] as const)('sends the %s protocol', async provider => {
  const mock = jest.spyOn(global, 'fetch').mockResolvedValue({ ok: true, json: async () => provider === 'Claude' ? { content: [{ type: 'text', text: 'OK' }] } : { choices: [{ message: { content: 'OK' } }] } } as Response);
  await expect(generer({ provider, base: 'https://example.com', model: 'test' }, 'secret', { system: 'system', user: 'user' })).resolves.toBe('OK');
  const [url, options] = mock.mock.calls[0];
  expect(url).toContain(provider === 'Claude' ? '/v1/messages' : '/chat/completions');
  expect(options?.headers).toMatchObject(provider === 'Claude' ? { 'x-api-key': 'secret', 'anthropic-version': '2023-06-01' } : { Authorization: 'Bearer secret' });
  expect(JSON.parse(options?.body as string).model).toBe('test');
});
