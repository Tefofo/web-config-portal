import { Injectable, inject, signal } from '@angular/core';
import { Observable, forkJoin, map, of, tap } from 'rxjs';
import { Environment } from '../models/environment.model';
import { User } from '../models/user.model';
import { EnvironmentService } from './environment.service';
import { UserService } from './user.service';

export interface ReferenceData {
  environments: Environment[];
  users: User[];
}

/**
 * Caches environments and users for label lookups across features. Loaded once
 * per session; call ensureLoaded() before relying on the name maps.
 */
@Injectable({ providedIn: 'root' })
export class ReferenceDataService {
  private readonly environmentService = inject(EnvironmentService);
  private readonly userService = inject(UserService);

  readonly environments = signal<Environment[]>([]);
  readonly users = signal<User[]>([]);

  private loaded = false;

  ensureLoaded(): Observable<ReferenceData> {
    if (this.loaded) {
      return of({ environments: this.environments(), users: this.users() });
    }
    return forkJoin({
      environments: this.environmentService.list(),
      users: this.userService.list({ page: 1, pageSize: 1000 }),
    }).pipe(
      map(({ environments, users }) => ({ environments, users: users.items })),
      tap((data) => {
        this.environments.set(data.environments);
        this.users.set(data.users);
        this.loaded = true;
      }),
    );
  }

  environmentName(id: string | null | undefined): string {
    if (!id) return '—';
    return this.environments().find((e) => e.id === id)?.name ?? '—';
  }

  userName(id: string | null | undefined): string {
    if (!id) return '—';
    const user = this.users().find((u) => u.id === id);
    return user ? `${user.firstName} ${user.lastName}` : '—';
  }

  /** Force a refresh on next ensureLoaded (e.g. after creating an environment). */
  invalidate(): void {
    this.loaded = false;
  }
}
