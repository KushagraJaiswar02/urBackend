import { expect, test, vi } from 'vitest';
import urBackend from '../src/index';

const mockApiKey = 'test-api-key';
const client = urBackend({ apiKey: mockApiKey });

test('signUp returns user object on success', async () => {
  const mockUser = { _id: '123', email: 'test@example.com' };
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: () => Promise.resolve({ success: true, data: mockUser }),
    }),
  );

  const user = await client.auth.signUp({ email: 'test@example.com', password: 'password' });
  expect(user).toEqual(mockUser);
});

test('login stores session token', async () => {
  const mockToken = 'mock-token';
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: () =>
        Promise.resolve({
          success: true,
          data: { token: mockToken, user: { _id: '123', email: 'test@example.com' } },
        }),
    }),
  );

  const response = await client.auth.login({ email: 'test@example.com', password: 'password' });
  expect(response.token).toBe(mockToken);
});

test('me() uses stored token from login', async () => {
  const mockToken = 'mock-token';
  const mockUser = { _id: '123', email: 'test@example.com' };

  // First mock login
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: () =>
        Promise.resolve({
          success: true,
          data: { token: mockToken, user: mockUser },
        }),
    }),
  );
  await client.auth.login({ email: 'test@example.com', password: 'password' });

  // Then mock me call
  const meFetchMock = vi.fn().mockResolvedValue({
    ok: true,
    headers: new Headers({ 'content-type': 'application/json' }),
    json: () => Promise.resolve({ success: true, data: mockUser }),
  });
  vi.stubGlobal('fetch', meFetchMock);

  await client.auth.me();

  expect(meFetchMock).toHaveBeenCalledWith(
    expect.stringContaining('/api/userAuth/me'),
    expect.objectContaining({
      headers: expect.objectContaining({
        Authorization: `Bearer ${mockToken}`,
      }),
    }),
  );
});

test('me() throws AuthError when no token present', async () => {
  client.auth.logout();
  await expect(client.auth.me()).rejects.toThrow('Authentication token is required');
});

test('login throws AuthError on 401', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      url: 'https://api.urbackend.bitbros.in/api/userAuth/login',
      statusText: 'Unauthorized',
      json: () => Promise.resolve({ success: false, message: 'Invalid credentials' }),
    }),
  );

  await expect(client.auth.login({ email: 'a', password: 'b' })).rejects.toThrow(
    'Invalid credentials',
  );
});

test('handles network failure', async () => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('DNS failure')));

  await expect(client.auth.login({ email: 'a', password: 'b' })).rejects.toThrow(
    'DNS failure',
  );
});
