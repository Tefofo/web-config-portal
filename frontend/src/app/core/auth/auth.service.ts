import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthUser } from '../models/user.model';
import { normalizeRole, Permission, RoleCode, ROLE_PERMISSIONS } from '../models/role.model';
import { LoginRequest, LoginResponse } from './auth.models';

const TOKEN_KEY = 'wcp.auth.token';
const REFRESH_KEY = 'wcp.auth.refresh';
const USER_KEY = 'wcp.auth.user';

/**
 * Authentication state holder and API facade.
 *
 * Persists a session (access) token, an optional refresh token, and the
 * (non-sensitive) authenticated user profile. Passwords are never stored.
 * "Remember me" chooses localStorage (persistent) vs sessionStorage (cleared
 * when the tab closes).
 *
 * The backend returns `{ accessToken, refreshToken, user }` while the legacy
 * mock returns `{ token, user }`; `persistSession` handles both.
 *
 * Frontend authorization derived here is for UX only; the backend is the real
 * security boundary.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/auth`;

  private readonly userSignal = signal<AuthUser | null>(this.readStoredUser());

  readonly currentUser = this.userSignal.asReadonly();
  readonly isAuthenticated = computed(() => this.userSignal() !== null);
  readonly role = computed<RoleCode | null>(() => this.userSignal()?.role ?? null);
  readonly permissions = computed<ReadonlySet<Permission>>(() => {
    const role = this.userSignal()?.role;
    return new Set(role ? ROLE_PERMISSIONS[role] : []);
  });

  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.baseUrl}/login`, request).pipe(
      tap((response) => this.persistSession(response, request.rememberMe)),
    );
  }

  /**
   * Exchanges the stored refresh token for a fresh access token. Re-persists
   * to whichever store currently holds the session so "remember me" is kept.
   */
  refresh(): Observable<LoginResponse> {
    const refreshToken = this.getRefreshToken() ?? '';
    const remember = localStorage.getItem(TOKEN_KEY) !== null;
    return this.http
      .post<LoginResponse>(`${this.baseUrl}/refresh`, { refreshToken })
      .pipe(tap((response) => this.persistSession(response, remember)));
  }

  logout(): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/logout`, {}).pipe(
      tap(() => this.clearSession()),
    );
  }

  /** Clears local session immediately, e.g. on 401 or forced logout. */
  clearSession(): void {
    for (const store of [localStorage, sessionStorage]) {
      store.removeItem(TOKEN_KEY);
      store.removeItem(REFRESH_KEY);
      store.removeItem(USER_KEY);
    }
    this.userSignal.set(null);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_KEY) ?? sessionStorage.getItem(REFRESH_KEY);
  }

  hasPermission(permission: Permission): boolean {
    return this.permissions().has(permission);
  }

  hasAnyPermission(permissions: readonly Permission[]): boolean {
    const held = this.permissions();
    return permissions.some((p) => held.has(p));
  }

  private persistSession(response: LoginResponse, rememberMe: boolean): void {
    const store = rememberMe ? localStorage : sessionStorage;
    // Ensure the other store is cleared so we have a single source of truth.
    const other = rememberMe ? sessionStorage : localStorage;
    other.removeItem(TOKEN_KEY);
    other.removeItem(REFRESH_KEY);
    other.removeItem(USER_KEY);

    // Prefer the real backend's accessToken, fall back to the mock's token.
    const accessToken = response.accessToken ?? response.token ?? '';
    store.setItem(TOKEN_KEY, accessToken);
    if (response.refreshToken) {
      store.setItem(REFRESH_KEY, response.refreshToken);
    } else {
      store.removeItem(REFRESH_KEY);
    }
    // Normalize the role so backend codes (ADMIN/PLATFORM_ADMIN) resolve to a
    // valid frontend RoleCode for permission lookups.
    const user: AuthUser = { ...response.user, role: normalizeRole(response.user.role) };
    store.setItem(USER_KEY, JSON.stringify(user));
    this.userSignal.set(user);
  }

  private readStoredUser(): AuthUser | null {
    const raw = localStorage.getItem(USER_KEY) ?? sessionStorage.getItem(USER_KEY);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  }
}
