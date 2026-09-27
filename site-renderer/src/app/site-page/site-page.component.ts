import { Component, effect, inject, input, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { SiteService } from '../site.service';
import { PublicSite } from '../site-document';
import { HeroComponent } from '../sections/hero.component';
import { AboutComponent } from '../sections/about.component';
import { EventsComponent } from '../sections/events.component';
import { GalleryComponent } from '../sections/gallery.component';
import { ContactComponent } from '../sections/contact.component';
import { FooterComponent } from '../sections/footer.component';
import { MenuComponent } from '../sections/menu.component';
import { HoursComponent } from '../sections/hours.component';
import { AmenitiesComponent } from '../sections/amenities.component';

type LoadState = 'loading' | 'ready' | 'notfound' | 'error';

@Component({
  selector: 'app-site-page',
  imports: [
    HeroComponent,
    AboutComponent,
    EventsComponent,
    GalleryComponent,
    ContactComponent,
    FooterComponent,
    MenuComponent,
    HoursComponent,
    AmenitiesComponent,
  ],
  templateUrl: './site-page.component.html',
})
export class SitePageComponent {
  private readonly service = inject(SiteService);
  private readonly document = inject(DOCUMENT);

  /** Route param, bound via withComponentInputBinding. */
  readonly slug = input.required<string>();

  readonly state = signal<LoadState>('loading');
  readonly site = signal<PublicSite | null>(null);

  constructor() {
    effect(() => {
      const slug = this.slug();
      if (slug) {
        this.load(slug);
      }
    });
  }

  private load(slug: string): void {
    this.state.set('loading');
    this.service.getBySlug(slug).subscribe({
      next: (site) => {
        this.site.set(site);
        this.applyBranding(site);
        this.document.title = site.content.branding.siteName || site.siteName;
        this.state.set('ready');
      },
      error: (err: { status?: number }) => {
        this.state.set(err?.status === 404 ? 'notfound' : 'error');
      },
    });
  }

  /** Applies the tenant's branding as CSS variables on the document root. */
  private applyBranding(site: PublicSite): void {
    const root = this.document.documentElement;
    const b = site.content.branding;
    root.style.setProperty('--brand-primary', b.primaryColor || '#111827');
    root.style.setProperty('--brand-secondary', b.secondaryColor || '#f59e0b');
    const font = b.fontFamily?.trim();
    root.style.setProperty(
      '--brand-font',
      font ? `'${font}', system-ui, sans-serif` : 'system-ui, sans-serif',
    );
    if (font) {
      this.loadGoogleFont(font);
    }
  }

  /** Best-effort load of the chosen family from Google Fonts. */
  private loadGoogleFont(family: string): void {
    const id = 'brand-font-link';
    const existing = this.document.getElementById(id) as HTMLLinkElement | null;
    const href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(
      family,
    )}:wght@400;600;700&display=swap`;
    if (existing) {
      existing.href = href;
      return;
    }
    const link = this.document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = href;
    this.document.head.appendChild(link);
  }
}
