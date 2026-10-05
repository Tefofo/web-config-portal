import { Component, computed, inject, signal, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { WebsiteService } from '../../core/services/website.service';
import { NotificationService } from '../../core/services/notification.service';
import { AuthService } from '../../core/auth/auth.service';
import { environment } from '../../../environments/environment';
import {
  MarketingSiteDocument,
  RestaurantSiteDocument,
  SiteTemplate,
} from '../../core/models/site.model';
import { TemplateEditor } from './site-editor';
import { MarketingEditorComponent } from './marketing-editor/marketing-editor.component';
import { RestaurantEditorComponent } from './restaurant-editor/restaurant-editor.component';

/**
 * Website editor shell. Loads the tenant's site, picks the per-template editor
 * component, and drives save/publish/preview. Each editor owns its own form;
 * the shell talks to the active one through the TemplateEditor contract.
 */
@Component({
  selector: 'app-website-editor',
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MarketingEditorComponent,
    RestaurantEditorComponent,
  ],
  templateUrl: './website-editor.component.html',
  styleUrl: './website-editor.component.scss',
})
export class WebsiteEditorComponent {
  private readonly service = inject(WebsiteService);
  private readonly notifications = inject(NotificationService);
  private readonly auth = inject(AuthService);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly slug = signal('');
  readonly published = signal(false);
  readonly template = signal<SiteTemplate | null>(null);

  readonly marketingDoc = signal<MarketingSiteDocument | null>(null);
  readonly restaurantDoc = signal<RestaurantSiteDocument | null>(null);

  readonly canManage = this.auth.hasPermission('website:manage');

  private readonly marketingEditor = viewChild(MarketingEditorComponent);
  private readonly restaurantEditor = viewChild(RestaurantEditorComponent);

  readonly previewUrl = computed(() => {
    const base = environment.siteRendererUrl;
    const s = this.slug();
    return s ? `${base}/site/${s}` : base;
  });

  constructor() {
    this.load();
  }

  private activeEditor(): TemplateEditor | undefined {
    return this.template() === 'restaurant-v1'
      ? this.restaurantEditor()
      : this.marketingEditor();
  }

  private load(): void {
    this.loading.set(true);
    this.service.getMine().subscribe({
      next: (site) => {
        this.slug.set(site.slug);
        this.published.set(site.published);
        this.template.set(site.content.template);
        if (site.content.template === 'restaurant-v1') {
          this.restaurantDoc.set(site.content);
        } else {
          this.marketingDoc.set(site.content);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  save(publish?: boolean): void {
    const editor = this.activeEditor();
    if (!editor || this.saving() || !this.canManage) {
      return;
    }
    if (!editor.isValid()) {
      editor.markAllTouched();
      return;
    }
    this.saving.set(true);
    const published = publish ?? this.published();
    this.service.updateMine({ content: editor.buildDocument(), published }).subscribe({
      next: (site) => {
        this.published.set(site.published);
        editor.markPristine();
        this.notifications.success(
          publish === true
            ? 'Website published.'
            : publish === false
              ? 'Website unpublished.'
              : 'Website saved.',
        );
        this.saving.set(false);
      },
      error: () => this.saving.set(false),
    });
  }
}
