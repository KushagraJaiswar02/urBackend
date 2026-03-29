import { expect, test, vi } from 'vitest';
import urBackend from '../src/index';

const mockApiKey = 'test-api-key';
const client = urBackend({ apiKey: mockApiKey });

test('getAll returns array of typed documents', async () => {
  const mockData = [
    { _id: '1', name: 'Product 1' },
    { _id: '2', name: 'Product 2' },
  ];
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: () => Promise.resolve({ success: true, data: mockData }),
    }),
  );

  const items = await client.db.getAll<{ _id: string; name: string }>('products');
  expect(items).toEqual(mockData);
  expect(items[0].name).toBe('Product 1');
});

test('getOne throws NotFoundError on 404', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      url: 'https://api.urbackend.bitbros.in/api/data/products/999',
      json: () => Promise.resolve({ success: false, message: 'Not Found' }),
    }),
  );

  await expect(client.db.getOne('products', '999')).rejects.toThrow('Not Found');
});

test('insert returns created document with _id', async () => {
  const payload = { name: 'New Item' };
  const mockCreated = { _id: 'new-id', ...payload };
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: () => Promise.resolve({ success: true, data: mockCreated }),
    }),
  );

  const result = await client.db.insert<{ _id: string; name: string }>('products', payload);
  expect(result._id).toBe('new-id');
});

test('update returns updated document', async () => {
  const payload = { name: 'Updated' };
  const mockUpdated = { _id: 'id-1', ...payload };
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: () => Promise.resolve({ success: true, data: mockUpdated }),
    }),
  );

  const result = await client.db.update<{ _id: string; name: string }>('products', 'id-1', payload);
  expect(result.name).toBe('Updated');
});

test('delete returns { deleted: true }', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: () => Promise.resolve({ success: true, data: { deleted: true } }),
    }),
  );

  const result = await client.db.delete('products', 'id-1');
  expect(result.deleted).toBe(true);
});

test('RateLimitError thrown on 429', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      url: 'https://api.urbackend.bitbros.in/api/data/products',
      headers: new Headers({ 'Retry-After': '60' }),
      json: () => Promise.resolve({ success: false, message: 'Too Many Requests' }),
    }),
  );

  try {
    await client.db.getAll('products');
  } catch (error: any) {
    expect(error.name).toBe('RateLimitError');
    expect(error.retryAfter).toBe(60);
  }
});

test('ValidationError thrown on 400', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      url: 'https://api.urbackend.bitbros.in/api/data/products',
      json: () => Promise.resolve({ success: false, message: 'Invalid data format' }),
    }),
  );

  await expect(client.db.insert('products', {})).rejects.toThrow('Invalid data format');
});
