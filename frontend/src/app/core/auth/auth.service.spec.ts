import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import { LoginResponse } from './auth.models';
import { environment } from '../../../environments/environment';

const AUTH = `${environment.apiUrl}/auth`;

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  const adminResponse: LoginResponse = {
    token: 'mock.token',
    user: {
      id: 'user-1',
      firstName: 'Amara',
      lastName: 'Okafor',
      email: 'admin@portal.dev',
      role: 'ADMINISTRATOR',
    },
  };

  const backendResponse: LoginResponse = {
    accessToken: 'access.token',
    refreshToken: 'refresh.token',
    user: {
      id: 'user-1',
      firstName: 'Amara',
      lastName: 'Okafor',
      email: 'admin@portal.dev',
      role: 'ADMINISTRATOR',
    },
  };

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
    sessionStorage.clear();
  });

  it('starts unauthenticated', () => {
    expect(service.isAuthenticated()).toBe(false);
    expect(service.currentUser()).toBeNull();
  });

  it('logs a user in and stores the session (remember me -> localStorage)', () => {
    service.login({ email: 'admin@portal.dev', password: 'password123', rememberMe: true }).subscribe();
    const req = httpMock.expectOne(`${AUTH}/login`);
    expect(req.request.method).toBe('POST');
    req.flush(adminResponse);

    expect(service.isAuthenticated()).toBe(true);
    expect(service.currentUser()?.email).toBe('admin@portal.dev');
    expect(localStorage.getItem('wcp.auth.token')).toBe('mock.token');
    expect(sessionStorage.getItem('wcp.auth.token')).toBeNull();
  });

  it('uses sessionStorage when rememberMe is false', () => {
    service.login({ email: 'admin@portal.dev', password: 'password123', rememberMe: false }).subscribe();
    httpMock.expectOne(`${AUTH}/login`).flush(adminResponse);

    expect(sessionStorage.getItem('wcp.auth.token')).toBe('mock.token');
    expect(localStorage.getItem('wcp.auth.token')).toBeNull();
  });

  it('stores accessToken and refreshToken from the backend response shape', () => {
    service.login({ email: 'admin@portal.dev', password: 'password123', rememberMe: true }).subscribe();
    httpMock.expectOne(`${AUTH}/login`).flush(backendResponse);

    expect(service.getToken()).toBe('access.token');
    expect(service.getRefreshToken()).toBe('refresh.token');
    expect(service.isAuthenticated()).toBe(true);
  });

  it('refreshes the access token using the stored refresh token', () => {
    service.login({ email: 'admin@portal.dev', password: 'password123', rememberMe: true }).subscribe();
    httpMock.expectOne(`${AUTH}/login`).flush(backendResponse);

    service.refresh().subscribe();
    const req = httpMock.expectOne(`${AUTH}/refresh`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ refreshToken: 'refresh.token' });
    req.flush({ accessToken: 'access.token.2', refreshToken: 'refresh.token.2', user: backendResponse.user } satisfies LoginResponse);

    expect(service.getToken()).toBe('access.token.2');
    expect(service.getRefreshToken()).toBe('refresh.token.2');
  });

  it('grants administrator all key permissions', () => {
    service.login({ email: 'admin@portal.dev', password: 'password123', rememberMe: true }).subscribe();
    httpMock.expectOne(`${AUTH}/login`).flush(adminResponse);

    expect(service.hasPermission('user:manage')).toBe(true);
    expect(service.hasPermission('configuration:delete')).toBe(true);
    expect(service.hasPermission('settings:manage')).toBe(true);
  });

  it('restricts a viewer to read-only permissions', () => {
    service.login({ email: 'viewer@portal.dev', password: 'password123', rememberMe: true }).subscribe();
    httpMock.expectOne(`${AUTH}/login`).flush({
      token: 't',
      user: { id: 'user-3', firstName: 'Sipho', lastName: 'Ndlovu', email: 'viewer@portal.dev', role: 'VIEWER' },
    } satisfies LoginResponse);

    expect(service.hasPermission('configuration:view')).toBe(true);
    expect(service.hasPermission('configuration:edit')).toBe(false);
    expect(service.hasPermission('user:manage')).toBe(false);
  });

  it('clears the session on logout', () => {
    service.login({ email: 'admin@portal.dev', password: 'password123', rememberMe: true }).subscribe();
    httpMock.expectOne(`${AUTH}/login`).flush(adminResponse);

    service.logout().subscribe();
    httpMock.expectOne(`${AUTH}/logout`).flush(null);

    expect(service.isAuthenticated()).toBe(false);
    expect(localStorage.getItem('wcp.auth.token')).toBeNull();
  });
});
