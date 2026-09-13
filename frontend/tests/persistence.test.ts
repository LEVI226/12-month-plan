import { createPersistence, STORAGE_KEYS } from '../src/lib/persistence';

function setup(entries: Record<string, string> = {}) {
  const data = new Map(Object.entries(entries));
  const storage = {
    getItem: jest.fn(async (key: string) => data.get(key) ?? null),
    setItem: jest.fn(async (key: string, value: string) => { data.set(key, value); }),
    removeItem: jest.fn(async (key: string) => { data.delete(key); }),
  };
  const persistence = createPersistence(storage, (raw): { answer: string } => {
    const value = JSON.parse(raw);
    if (typeof value?.answer !== 'string') throw Error('invalid');
    return value;
  });
  return { data, storage, persistence };
}
const good = JSON.stringify({ answer: 'Mon bilan' });
test('loads existing answers', async () => {
  expect((await setup({ [STORAGE_KEYS[0]]: good }).persistence.load()).state?.answer).toBe('Mon bilan');
});
test('restores without overwriting the last valid backup with corrupt data', async () => {
  const { persistence, data } = setup({ [STORAGE_KEYS[0]]: '{broken', [STORAGE_KEYS[1]]: good });
  const result = await persistence.load();
  expect(result.message).toContain('restaurées');
  await persistence.save(result.state!);
  expect(data.get(STORAGE_KEYS[1])).toBe(good);
  expect(data.get(STORAGE_KEYS[2])).toBe('{broken');
});
test('read failure blocks subsequent writes', async () => {
  const { persistence, storage } = setup();
  storage.getItem.mockRejectedValueOnce(Error('disk'));
  await expect(persistence.load()).rejects.toThrow();
  await expect(persistence.save({ answer: 'empty' })).rejects.toThrow();
  expect(storage.setItem).not.toHaveBeenCalled();
});
test('failed quarantine never authorizes an overwrite', async () => {
  const { persistence, storage, data } = setup({ [STORAGE_KEYS[0]]: '{broken' });
  storage.setItem.mockRejectedValueOnce(Error('full'));
  await expect(persistence.load()).rejects.toThrow();
  await expect(persistence.save({ answer: 'empty' })).rejects.toThrow();
  expect(data.get(STORAGE_KEYS[0])).toBe('{broken');
});
test('deletion runs after a pending save and removes all keys', async () => {
  const { persistence, data } = setup({ [STORAGE_KEYS[0]]: good });
  await persistence.load();
  await Promise.all([persistence.save({ answer: 'new' }), persistence.clear()]);
  expect(data.size).toBe(0);
});
test('write failure reaches the caller', async () => {
  const { persistence, storage } = setup();
  await persistence.load();
  storage.setItem.mockRejectedValueOnce(Error('full'));
  await expect(persistence.save({ answer: 'new' })).rejects.toThrow('full');
});
