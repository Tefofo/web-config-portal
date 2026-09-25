import { TestBed } from '@angular/core/testing';
import { UrlTree } from '@angular/router';
import { permissionGuard } from './permission.guard';
import { AuthService } from '../auth/auth.service';

class AuthStub {
  private authed = true;
  private perms = new Set<string>(['configuration:view']);
  isAuthenticated() {
    return this.authed;
  }
  hasAnyPermission(list: readonly string[]) {
    return list.some((p) => this.perms.has(p));
  }
  setAuthed(v: boolean) {
    this.authed = v;
  }
  setPerms(p: string[]) {
    this.perms = new Set(p);
  }
}

describe('permissionGuard', () => {
  let auth: AuthStub;

  beforeEach(() => {
    auth = new AuthStub();
    TestBed.configureTestingModule({
      providers: [{ provide: AuthService, useValue: auth }],
    });
  });

  function run(...perms: string[]) {
    return TestBed.runInInjectionContext(() =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (permissionGuard(...(perms as any)) as any)({}, {} as any),
    );
  }

  it('allows access when the user holds the permission', () => {
    expect(run('configuration:view')).toBe(true);
  });

  it('redirects to /forbidden when the permission is missing', () => {
    const result = run('user:manage');
    expect(result instanceof UrlTree).toBe(true);
    expect((result as UrlTree).toString()).toContain('/forbidden');
  });

  it('redirects to /login when unauthenticated', () => {
    auth.setAuthed(false);
    const result = run('configuration:view');
    expect(result instanceof UrlTree).toBe(true);
    expect((result as UrlTree).toString()).toContain('/login');
  });
});
