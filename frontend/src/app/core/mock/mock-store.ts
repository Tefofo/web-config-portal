import { Injectable } from '@angular/core';
import { AuditEvent } from '../models/audit.model';
import { Configuration } from '../models/configuration.model';
import { Environment } from '../models/environment.model';
import { Role } from '../models/role.model';
import { SystemSettings } from '../models/settings.model';
import { User } from '../models/user.model';
import {
  MOCK_AUDIT_EVENTS,
  MOCK_CONFIGURATIONS,
  MOCK_ENVIRONMENTS,
  MOCK_ROLES,
  MOCK_SETTINGS,
  MOCK_USERS,
} from './mock-data';

/**
 * Mutable in-memory database backing the mock API. Seeded from mock-data on
 * construction. A singleton so state persists across navigations within a
 * session (but resets on full reload — acceptable for a mock).
 */
@Injectable({ providedIn: 'root' })
export class MockStore {
  configurations: Configuration[] = structuredClone(MOCK_CONFIGURATIONS);
  environments: Environment[] = structuredClone(MOCK_ENVIRONMENTS);
  users: User[] = structuredClone(MOCK_USERS);
  roles: Role[] = structuredClone(MOCK_ROLES);
  auditEvents: AuditEvent[] = structuredClone(MOCK_AUDIT_EVENTS);
  settings: SystemSettings = structuredClone(MOCK_SETTINGS);

  private sequence = 1000;

  nextId(prefix: string): string {
    this.sequence += 1;
    return `${prefix}-${this.sequence}`;
  }

  recordAudit(event: Omit<AuditEvent, 'id' | 'timestamp'>): void {
    this.auditEvents.unshift({
      ...event,
      id: this.nextId('audit'),
      timestamp: new Date().toISOString(),
    });
  }
}
