import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../core/auth/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { ROLE_LABELS } from '../../core/models/role.model';
import { BREADCRUMB_LABELS } from '../breadcrumbs';
import { NAVIGATION, NavGroup } from '../navigation';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-shell',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatTooltipModule,
  ],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
})
export class ShellComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly breakpoints = inject(BreakpointObserver);
  readonly theme = inject(ThemeService);

  readonly isDark = computed(() => this.theme.resolved() === 'dark');
  readonly themeMode = this.theme.themeMode;

  readonly branding = environment.branding;
  readonly user = this.auth.currentUser;
  readonly roleLabel = computed(() => {
    const role = this.user()?.role;
    return role ? ROLE_LABELS[role] : '';
  });

  readonly collapsed = signal(false);

  readonly isHandset = toSignal(
    this.breakpoints.observe([Breakpoints.Handset]).pipe(map((r) => r.matches)),
    { initialValue: false },
  );

  /** Navigation groups filtered to items the current user may access. */
  readonly navGroups = computed<NavGroup[]>(() => {
    // Touch permissions signal so this recomputes on login/logout.
    this.auth.permissions();
    return NAVIGATION.map((group) => ({
      ...group,
      items: group.items.filter((item) => this.auth.hasAnyPermission(item.permissions)),
    })).filter((group) => group.items.length > 0);
  });

  readonly breadcrumbs = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => this.buildBreadcrumbs(e.urlAfterRedirects)),
      startWith(this.buildBreadcrumbs(this.router.url)),
    ),
    { initialValue: [] as { label: string; url: string }[] },
  );

  toggleSidebar(): void {
    this.collapsed.update((v) => !v);
  }

  logout(): void {
    this.auth.logout().subscribe({
      next: () => void this.router.navigate(['/login']),
      error: () => void this.router.navigate(['/login']),
    });
  }

  private buildBreadcrumbs(url: string): { label: string; url: string }[] {
    const segments = url.split('?')[0].split('/').filter(Boolean);
    const crumbs: { label: string; url: string }[] = [];
    let path = '';
    for (const segment of segments) {
      path += `/${segment}`;
      const label = BREADCRUMB_LABELS[segment] ?? this.humanize(segment);
      crumbs.push({ label, url: path });
    }
    return crumbs;
  }

  private humanize(segment: string): string {
    // IDs (e.g. cfg-1001) become "Details" for readability.
    if (/[-]/.test(segment) || /^\d/.test(segment)) {
      return 'Details';
    }
    return segment.charAt(0).toUpperCase() + segment.slice(1);
  }
}
