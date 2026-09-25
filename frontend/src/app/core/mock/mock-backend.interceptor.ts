import {
  HttpErrorResponse,
  HttpEvent,
  HttpInterceptorFn,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, delay, of, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuditEvent } from '../models/audit.model';
import { Configuration } from '../models/configuration.model';
import { Environment } from '../models/environment.model';
import { PagedResult } from '../models/api.model';
import { User } from '../models/user.model';
import { MOCK_DEMO_PASSWORD } from './mock-data';
import { MockStore } from './mock-store';

const LATENCY_MS = 350;

function ok<T>(body: T): Observable<HttpEvent<T>> {
  return of(new HttpResponse({ status: 200, body })).pipe(delay(LATENCY_MS));
}

function fail(status: number, message: string): Observable<never> {
  return throwError(
    () => new HttpErrorResponse({ status, error: { message } }),
  ).pipe(delay(LATENCY_MS)) as Observable<never>;
}

function param(req: HttpRequest<unknown>, key: string): string | null {
  return req.params.get(key);
}

function paginate<T>(items: T[], req: HttpRequest<unknown>): PagedResult<T> {
  const page = Number(param(req, 'page') ?? '1');
  // Accept `limit` (what services now send) and `pageSize` for backwards compat.
  const pageSize = Number(param(req, 'limit') ?? param(req, 'pageSize') ?? '10');
  const start = (page - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    total: items.length,
    page,
    pageSize,
  };
}

function matchId(url: string, base: string): string | null {
  const re = new RegExp(`${base}/([^/]+)$`);
  return re.exec(url)?.[1] ?? null;
}

function matchAction(url: string, base: string, action: string): string | null {
  const re = new RegExp(`${base}/([^/]+)/${action}$`);
  return re.exec(url)?.[1] ?? null;
}

/**
 * Development-only mock backend. Intercepts /api/* requests and serves data
 * from MockStore. Enabled via environment.useMockApi. Designed to be removed
 * with zero changes to feature services once a real backend exists.
 */
export const mockBackendInterceptor: HttpInterceptorFn = (req, next) => {
  if (!environment.useMockApi || !req.url.includes('/api/')) {
    return next(req);
  }

  const store = inject(MockStore);
  const url = req.url;
  const method = req.method.toUpperCase();

  // ---- Auth ----------------------------------------------------------------
  if (url.endsWith('/auth/login') && method === 'POST') {
    const { email, password } = (req.body ?? {}) as { email?: string; password?: string };
    const user = store.users.find((u) => u.email.toLowerCase() === (email ?? '').toLowerCase());
    if (!user || password !== MOCK_DEMO_PASSWORD || user.status !== 'ACTIVE') {
      store.recordAudit({
        userId: user?.id ?? 'unknown',
        userName: user ? `${user.firstName} ${user.lastName}` : (email ?? 'unknown'),
        action: 'LOGIN',
        entity: 'AUTH',
        entityId: null,
        environmentId: null,
        description: 'Failed login attempt.',
        result: 'FAILURE',
      });
      return fail(401, 'Invalid email or password.');
    }
    user.lastLoginAt = new Date().toISOString();
    store.recordAudit({
      userId: user.id,
      userName: `${user.firstName} ${user.lastName}`,
      action: 'LOGIN',
      entity: 'AUTH',
      entityId: null,
      environmentId: null,
      description: 'User signed in.',
      result: 'SUCCESS',
    });
    return ok({
      token: `mock.jwt.${user.id}.${Date.now()}`,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      },
    });
  }

  if (url.endsWith('/auth/logout') && method === 'POST') {
    return ok<void>(undefined as unknown as void);
  }

  // ---- Configurations ------------------------------------------------------
  if (url.includes('/configurations')) {
    const response = handleConfigurations(store, req, url, method);
    if (response) {
      return response;
    }
  }

  // ---- Environments --------------------------------------------------------
  if (url.includes('/environments')) {
    const response = handleEnvironments(store, req, url, method);
    if (response) {
      return response;
    }
  }

  // ---- Users ---------------------------------------------------------------
  if (url.includes('/users')) {
    const response = handleUsers(store, req, url, method);
    if (response) {
      return response;
    }
  }

  // ---- Roles & permissions -------------------------------------------------
  if (url.endsWith('/roles') && method === 'GET') {
    return ok(store.roles);
  }

  // ---- Audit ---------------------------------------------------------------
  if (url.includes('/audit-logs') && method === 'GET') {
    return ok(paginate(filterAudit(store.auditEvents, req), req));
  }

  // ---- Settings ------------------------------------------------------------
  if (url.endsWith('/settings') && method === 'GET') {
    return ok(store.settings);
  }
  if (url.endsWith('/settings') && method === 'PUT') {
    store.settings = { ...store.settings, ...(req.body as object) };
    store.recordAudit({
      userId: 'user-1',
      userName: 'System',
      action: 'UPDATE',
      entity: 'SETTINGS',
      entityId: null,
      environmentId: null,
      description: 'Updated system settings.',
      result: 'SUCCESS',
    });
    return ok(store.settings);
  }

  return fail(404, 'Mock endpoint not found.');
};

function filterAudit(events: AuditEvent[], req: HttpRequest<unknown>): AuditEvent[] {
  let result = [...events];
  const userId = param(req, 'userId');
  const action = param(req, 'action');
  const entity = param(req, 'entity');
  const environmentId = param(req, 'environmentId');
  const from = param(req, 'from');
  const to = param(req, 'to');
  if (userId) result = result.filter((e) => e.userId === userId);
  if (action) result = result.filter((e) => e.action === action);
  if (entity) result = result.filter((e) => e.entity === entity);
  if (environmentId) result = result.filter((e) => e.environmentId === environmentId);
  if (from) result = result.filter((e) => e.timestamp >= from);
  if (to) result = result.filter((e) => e.timestamp <= to);
  return result;
}

function handleConfigurations(
  store: MockStore,
  req: HttpRequest<unknown>,
  url: string,
  method: string,
): Observable<HttpEvent<unknown>> | null {
  const dup = matchAction(url, '/configurations', 'duplicate');
  if (dup && method === 'POST') {
    const source = store.configurations.find((c) => c.id === dup);
    if (!source) return fail(404, 'Configuration not found.');
    const body = (req.body ?? {}) as Partial<Configuration>;
    if (body.key && store.configurations.some((c) => c.key === body.key && c.environmentId === (body.environmentId ?? source.environmentId))) {
      return fail(409, 'A configuration with this key already exists in the environment.');
    }
    const now = new Date().toISOString();
    const copy: Configuration = {
      ...source,
      ...body,
      id: store.nextId('cfg'),
      createdAt: now,
      updatedAt: now,
    };
    store.configurations.unshift(copy);
    store.recordAudit({ userId: copy.ownerId, userName: 'System', action: 'CREATE', entity: 'CONFIGURATION', entityId: copy.id, environmentId: copy.environmentId, description: `Duplicated configuration ${copy.key}.`, result: 'SUCCESS' });
    return ok(copy);
  }

  const enableId = matchAction(url, '/configurations', 'enable');
  const disableId = matchAction(url, '/configurations', 'disable');
  if ((enableId || disableId) && method === 'POST') {
    const id = (enableId ?? disableId) as string;
    const cfg = store.configurations.find((c) => c.id === id);
    if (!cfg) return fail(404, 'Configuration not found.');
    cfg.status = enableId ? 'ACTIVE' : 'DISABLED';
    cfg.updatedAt = new Date().toISOString();
    store.recordAudit({ userId: cfg.ownerId, userName: 'System', action: enableId ? 'ENABLE' : 'DISABLE', entity: 'CONFIGURATION', entityId: cfg.id, environmentId: cfg.environmentId, description: `${enableId ? 'Enabled' : 'Disabled'} ${cfg.key}.`, result: 'SUCCESS' });
    return ok(cfg);
  }

  if (url.endsWith('/configurations') && method === 'GET') {
    return ok(paginate(filterConfigurations(store.configurations, req), req));
  }

  if (url.endsWith('/configurations') && method === 'POST') {
    const body = req.body as Configuration;
    if (store.configurations.some((c) => c.key === body.key && c.environmentId === body.environmentId)) {
      return fail(409, 'A configuration with this key already exists in the environment.');
    }
    const now = new Date().toISOString();
    const created: Configuration = { ...body, id: store.nextId('cfg'), createdAt: now, updatedAt: now, createdBy: body.ownerId, updatedBy: body.ownerId };
    store.configurations.unshift(created);
    store.recordAudit({ userId: created.ownerId, userName: 'System', action: 'CREATE', entity: 'CONFIGURATION', entityId: created.id, environmentId: created.environmentId, description: `Created ${created.key}.`, result: 'SUCCESS' });
    return ok(created);
  }

  const id = matchId(url, '/configurations');
  if (id && method === 'GET') {
    const cfg = store.configurations.find((c) => c.id === id);
    return cfg ? ok(cfg) : fail(404, 'Configuration not found.');
  }
  if (id && (method === 'PUT' || method === 'PATCH')) {
    const idx = store.configurations.findIndex((c) => c.id === id);
    if (idx === -1) return fail(404, 'Configuration not found.');
    const existing = store.configurations[idx];
    const body = req.body as Partial<Configuration>;
    // key and environmentId are immutable.
    const updated: Configuration = { ...existing, ...body, key: existing.key, environmentId: existing.environmentId, id: existing.id, updatedAt: new Date().toISOString() };
    store.configurations[idx] = updated;
    store.recordAudit({ userId: updated.ownerId, userName: 'System', action: 'UPDATE', entity: 'CONFIGURATION', entityId: updated.id, environmentId: updated.environmentId, description: `Updated ${updated.key}.`, result: 'SUCCESS' });
    return ok(updated);
  }
  if (id && method === 'DELETE') {
    const idx = store.configurations.findIndex((c) => c.id === id);
    if (idx === -1) return fail(404, 'Configuration not found.');
    const [removed] = store.configurations.splice(idx, 1);
    store.recordAudit({ userId: removed.ownerId, userName: 'System', action: 'DELETE', entity: 'CONFIGURATION', entityId: removed.id, environmentId: removed.environmentId, description: `Deleted ${removed.key}.`, result: 'SUCCESS' });
    return ok<void>(undefined as unknown as void);
  }

  return null;
}

function filterConfigurations(items: Configuration[], req: HttpRequest<unknown>): Configuration[] {
  let result = [...items];
  const search = param(req, 'search')?.toLowerCase();
  const category = param(req, 'category');
  const environmentId = param(req, 'environmentId');
  const status = param(req, 'status');
  const type = param(req, 'type');
  const ownerId = param(req, 'ownerId');
  if (search) {
    result = result.filter(
      (c) => c.name.toLowerCase().includes(search) || c.key.toLowerCase().includes(search),
    );
  }
  if (category) result = result.filter((c) => c.category === category);
  if (environmentId) result = result.filter((c) => c.environmentId === environmentId);
  if (status) result = result.filter((c) => c.status === status);
  if (type) result = result.filter((c) => c.type === type);
  if (ownerId) result = result.filter((c) => c.ownerId === ownerId);

  const sortBy = param(req, 'sortBy');
  const sortDir = param(req, 'sortDir') === 'desc' ? -1 : 1;
  if (sortBy) {
    result.sort((a, b) => {
      const av = String((a as unknown as Record<string, unknown>)[sortBy] ?? '');
      const bv = String((b as unknown as Record<string, unknown>)[sortBy] ?? '');
      return av.localeCompare(bv) * sortDir;
    });
  }
  return result;
}

function handleEnvironments(
  store: MockStore,
  req: HttpRequest<unknown>,
  url: string,
  method: string,
): Observable<HttpEvent<unknown>> | null {
  if (url.endsWith('/environments') && method === 'GET') {
    return ok(store.environments);
  }
  if (url.endsWith('/environments') && method === 'POST') {
    const now = new Date().toISOString();
    const created: Environment = { ...(req.body as Environment), id: store.nextId('env'), createdAt: now, updatedAt: now };
    store.environments.push(created);
    store.recordAudit({ userId: 'user-1', userName: 'System', action: 'CREATE', entity: 'ENVIRONMENT', entityId: created.id, environmentId: created.id, description: `Created environment ${created.name}.`, result: 'SUCCESS' });
    return ok(created);
  }
  const id = matchId(url, '/environments');
  if (id && method === 'PUT') {
    const idx = store.environments.findIndex((e) => e.id === id);
    if (idx === -1) return fail(404, 'Environment not found.');
    const updated: Environment = { ...store.environments[idx], ...(req.body as Partial<Environment>), id, updatedAt: new Date().toISOString() };
    store.environments[idx] = updated;
    store.recordAudit({ userId: 'user-1', userName: 'System', action: 'UPDATE', entity: 'ENVIRONMENT', entityId: id, environmentId: id, description: `Updated environment ${updated.name}.`, result: 'SUCCESS' });
    return ok(updated);
  }
  if (id && method === 'DELETE') {
    const idx = store.environments.findIndex((e) => e.id === id);
    if (idx === -1) return fail(404, 'Environment not found.');
    if (store.configurations.some((c) => c.environmentId === id)) {
      return fail(409, 'Cannot delete an environment that still has configurations.');
    }
    const [removed] = store.environments.splice(idx, 1);
    store.recordAudit({ userId: 'user-1', userName: 'System', action: 'DELETE', entity: 'ENVIRONMENT', entityId: id, environmentId: null, description: `Deleted environment ${removed.name}.`, result: 'SUCCESS' });
    return ok<void>(undefined as unknown as void);
  }
  return null;
}

function handleUsers(
  store: MockStore,
  req: HttpRequest<unknown>,
  url: string,
  method: string,
): Observable<HttpEvent<unknown>> | null {
  const activateId = matchAction(url, '/users', 'activate');
  const deactivateId = matchAction(url, '/users', 'deactivate');
  if ((activateId || deactivateId) && method === 'POST') {
    const id = (activateId ?? deactivateId) as string;
    const user = store.users.find((u) => u.id === id);
    if (!user) return fail(404, 'User not found.');
    user.status = activateId ? 'ACTIVE' : 'INACTIVE';
    store.recordAudit({ userId: id, userName: `${user.firstName} ${user.lastName}`, action: activateId ? 'ENABLE' : 'DISABLE', entity: 'USER', entityId: id, environmentId: null, description: `${activateId ? 'Activated' : 'Deactivated'} user ${user.email}.`, result: 'SUCCESS' });
    return ok(user);
  }

  if (url.endsWith('/users') && method === 'GET') {
    return ok(paginate(filterUsers(store.users, req), req));
  }
  if (url.endsWith('/users') && method === 'POST') {
    const body = req.body as User;
    if (store.users.some((u) => u.email.toLowerCase() === body.email.toLowerCase())) {
      return fail(409, 'A user with this email already exists.');
    }
    const created: User = { ...body, id: store.nextId('user'), lastLoginAt: null, createdAt: new Date().toISOString() };
    store.users.push(created);
    store.recordAudit({ userId: created.id, userName: `${created.firstName} ${created.lastName}`, action: 'CREATE', entity: 'USER', entityId: created.id, environmentId: null, description: `Created user ${created.email}.`, result: 'SUCCESS' });
    return ok(created);
  }
  const id = matchId(url, '/users');
  if (id && method === 'GET') {
    const user = store.users.find((u) => u.id === id);
    return user ? ok(user) : fail(404, 'User not found.');
  }
  if (id && (method === 'PUT' || method === 'PATCH')) {
    const idx = store.users.findIndex((u) => u.id === id);
    if (idx === -1) return fail(404, 'User not found.');
    const body = req.body as Partial<User>;
    if (body.email && store.users.some((u) => u.id !== id && u.email.toLowerCase() === body.email!.toLowerCase())) {
      return fail(409, 'A user with this email already exists.');
    }
    const updated: User = { ...store.users[idx], ...body, id };
    store.users[idx] = updated;
    store.recordAudit({ userId: id, userName: `${updated.firstName} ${updated.lastName}`, action: 'UPDATE', entity: 'USER', entityId: id, environmentId: null, description: `Updated user ${updated.email}.`, result: 'SUCCESS' });
    return ok(updated);
  }
  return null;
}

function filterUsers(items: User[], req: HttpRequest<unknown>): User[] {
  let result = [...items];
  const search = param(req, 'search')?.toLowerCase();
  const role = param(req, 'role');
  const status = param(req, 'status');
  if (search) {
    result = result.filter(
      (u) =>
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(search) ||
        u.email.toLowerCase().includes(search),
    );
  }
  if (role) result = result.filter((u) => u.role === role);
  if (status) result = result.filter((u) => u.status === status);
  return result;
}
