import { TestBed } from '@angular/core/testing';
import {
  HttpClient,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { errorInterceptor } from './error.interceptor';
import { NotificationService } from '../services/notification.service';
import { AuthService } from '../auth/auth.service';

describe('errorInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  const notifications = { error: (_msg: string) => void _msg };
  const auth = { clearSession: () => undefined };
  const router = { navigate: () => Promise.resolve(true) };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        { provide: NotificationService, useValue: notifications },
        { provide: AuthService, useValue: auth },
        { provide: Router, useValue: router },
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('notifies on a 500 error and rethrows', () => {
    const errorSpy = vi.spyOn(notifications, 'error');
    let errored = false;
    http.get('/api/configurations').subscribe({ error: () => (errored = true) });
    httpMock.expectOne('/api/configurations').flush('boom', { status: 500, statusText: 'Server Error' });
    expect(errored).toBe(true);
    expect(errorSpy).toHaveBeenCalled();
  });

  it('clears the session on 401', () => {
    const clearSpy = vi.spyOn(auth, 'clearSession');
    http.get('/api/users').subscribe({ error: () => undefined });
    httpMock.expectOne('/api/users').flush('nope', { status: 401, statusText: 'Unauthorized' });
    expect(clearSpy).toHaveBeenCalled();
  });

  it('does not surface a snackbar for a failed login attempt', () => {
    const errorSpy = vi.spyOn(notifications, 'error');
    http.post('/api/auth/login', {}).subscribe({ error: () => undefined });
    httpMock.expectOne('/api/auth/login').flush('bad', { status: 401, statusText: 'Unauthorized' });
    expect(errorSpy).not.toHaveBeenCalled();
  });
});
