import { AuthUser } from '../models/user.model';

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe: boolean;
}

/**
 * Login/refresh response.
 *
 * Two shapes are supported for backward compatibility:
 * - Real backend: `{ accessToken, refreshToken, user }`.
 * - Legacy mock:  `{ token, user }`.
 *
 * `AuthService` detects which shape arrived (prefers `accessToken`) so both
 * the mock and the real API work without touching call sites.
 */
export interface LoginResponse {
  /** Access token from the real backend. */
  accessToken?: string;
  /** Refresh token from the real backend. */
  refreshToken?: string;
  /** Legacy token field used by the in-memory mock. */
  token?: string;
  user: AuthUser;
}

export interface RefreshRequest {
  refreshToken: string;
}
