import { UrBackendClient } from '../client';
import { AuthUser, AuthResponse, SignUpPayload, LoginPayload } from '../types';
import { AuthError } from '../errors';

export class AuthModule {
  private sessionToken?: string;

  constructor(private client: UrBackendClient) {}

  /**
   * Create a new user account
   */
  public async signUp(payload: SignUpPayload): Promise<AuthUser> {
    return this.client.request<AuthUser>('POST', '/api/userAuth/signup', { body: payload });
  }

  /**
   * Log in an existing user and store the session token
   */
  public async login(payload: LoginPayload): Promise<AuthResponse> {
    const response = await this.client.request<AuthResponse>('POST', '/api/userAuth/login', {
      body: payload,
    });
    this.sessionToken = response.token;
    return response;
  }

  /**
   * Get the current authenticated user's profile
   */
  public async me(token?: string): Promise<AuthUser> {
    const activeToken = token || this.sessionToken;

    if (!activeToken) {
      throw new AuthError('Authentication token is required for /me endpoint', 401, '/api/userAuth/me');
    }

    return this.client.request<AuthUser>('GET', '/api/userAuth/me', { token: activeToken });
  }

  /**
   * Clear the local session token
   */
  public logout(): void {
    this.sessionToken = undefined;
  }
}
