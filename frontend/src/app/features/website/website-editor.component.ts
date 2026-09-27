import { Component, computed, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTabsModule } from '@angular/material/tabs';
import { WebsiteService } from '../../core/services/website.service';
import { NotificationService } from '../../core/services/notification.service';
import { AuthService } from '../../core/auth/auth.service';
import { environment } from '../../../environments/environment';
import {
  MenuItem,
  OpeningHours,
  SiteDocument,
  SiteEvent,
  SiteTemplate,
} from '../../core/models/site.model';

@Component({
  selector: 'app-website-editor',
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    MatProgressBarModule,
  ],
  templateUrl: './website-editor.component.html',
  styleUrl: './website-editor.component.scss',
})
export class WebsiteEditorComponent {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(WebsiteService);
  private readonly notifications = inject(NotificationService);
  private readonly auth = inject(AuthService);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly slug = signal<string>('');
  readonly published = signal(false);
  readonly template = signal<SiteTemplate>('marketing-v1');

  readonly isRestaurant = computed(() => this.template() === 'restaurant-v1');
  readonly canManage = this.auth.hasPermission('website:manage');

  /** Public preview URL for the renderer app. */
  readonly previewUrl = computed(() => {
    const base = environment.siteRendererUrl;
    const s = this.slug();
    return s ? `${base}/site/${s}` : base;
  });

  readonly form = this.fb.nonNullable.group({
    branding: this.fb.nonNullable.group({
      siteName: ['', Validators.required],
      logoUrl: [''],
      primaryColor: ['#111827', Validators.required],
      secondaryColor: ['#f59e0b', Validators.required],
      fontFamily: ['Inter', Validators.required],
    }),
    hero: this.fb.nonNullable.group({
      headline: ['', Validators.required],
      subheadline: [''],
      backgroundImageUrl: [''],
      ctaLabel: [''],
      ctaUrl: [''],
    }),
    about: this.fb.nonNullable.group({
      heading: [''],
      body: [''],
      imageUrl: [''],
    }),
    // Restaurant-only groups (present but unused for marketing).
    menuCategories: this.fb.array<FormGroup>([]),
    menu: this.fb.array<FormGroup>([]),
    hours: this.fb.array<FormGroup>([]),
    amenities: this.fb.array<FormGroup>([]),
    orderUrl: [''],
    events: this.fb.array<FormGroup>([]),
    gallery: this.fb.array<FormGroup>([]),
    contact: this.fb.nonNullable.group({
      email: ['', Validators.email],
      phone: [''],
      address: [''],
      instagram: [''],
      facebook: [''],
      twitter: [''],
    }),
    sections: this.fb.nonNullable.group({
      hero: [true],
      about: [true],
      menu: [true],
      hours: [true],
      amenities: [true],
      events: [true],
      gallery: [true],
      contact: [true],
    }),
  });

  get events(): FormArray<FormGroup> {
    return this.form.controls.events;
  }
  get gallery(): FormArray<FormGroup> {
    return this.form.controls.gallery;
  }
  get menu(): FormArray<FormGroup> {
    return this.form.controls.menu;
  }
  get menuCategories(): FormArray<FormGroup> {
    return this.form.controls.menuCategories;
  }
  get hours(): FormArray<FormGroup> {
    return this.form.controls.hours;
  }
  get amenities(): FormArray<FormGroup> {
    return this.form.controls.amenities;
  }

  constructor() {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.service.getMine().subscribe({
      next: (site) => {
        this.slug.set(site.slug);
        this.published.set(site.published);
        this.template.set(site.content.template);
        this.patch(site.content);
        if (!this.canManage) {
          this.form.disable();
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  private patch(content: SiteDocument): void {
    this.events.clear();
    this.gallery.clear();
    this.menu.clear();
    this.menuCategories.clear();
    this.hours.clear();
    this.amenities.clear();

    content.events.forEach((e) => this.events.push(this.eventGroup(e)));
    content.gallery.forEach((url) => this.gallery.push(this.galleryGroup(url)));

    if (content.template === 'restaurant-v1') {
      content.menuCategories.forEach((c) => this.menuCategories.push(this.textGroup(c)));
      content.menu.forEach((m) => this.menu.push(this.menuGroup(m)));
      content.hours.forEach((h) => this.hours.push(this.hoursGroup(h)));
      content.amenities.forEach((a) => this.amenities.push(this.textGroup(a)));
      this.form.controls.orderUrl.setValue(content.orderUrl);
    }

    this.form.patchValue({
      branding: content.branding,
      hero: content.hero,
      about: content.about,
      contact: content.contact,
      sections: { ...this.form.controls.sections.getRawValue(), ...content.sections },
    });
  }

  private eventGroup(e?: SiteEvent): FormGroup {
    return this.fb.nonNullable.group({
      title: [e?.title ?? '', Validators.required],
      date: [e?.date ?? ''],
      venue: [e?.venue ?? ''],
      description: [e?.description ?? ''],
      ticketUrl: [e?.ticketUrl ?? ''],
    });
  }

  private galleryGroup(url = ''): FormGroup {
    return this.fb.nonNullable.group({ url: [url] });
  }

  private textGroup(value = ''): FormGroup {
    return this.fb.nonNullable.group({ value: [value] });
  }

  private menuGroup(m?: MenuItem): FormGroup {
    return this.fb.nonNullable.group({
      name: [m?.name ?? '', Validators.required],
      description: [m?.description ?? ''],
      price: [m?.price ?? 0, [Validators.required, Validators.min(0)]],
      category: [m?.category ?? '', Validators.required],
      tag: [m?.tag ?? ''],
    });
  }

  private hoursGroup(h?: OpeningHours): FormGroup {
    return this.fb.nonNullable.group({
      days: [h?.days ?? '', Validators.required],
      time: [h?.time ?? '', Validators.required],
    });
  }

  // --- Dynamic list helpers ---
  addEvent(): void {
    this.events.push(this.eventGroup());
    this.form.markAsDirty();
  }
  removeEvent(i: number): void {
    this.events.removeAt(i);
    this.form.markAsDirty();
  }
  addImage(): void {
    this.gallery.push(this.galleryGroup());
    this.form.markAsDirty();
  }
  removeImage(i: number): void {
    this.gallery.removeAt(i);
    this.form.markAsDirty();
  }
  addMenuItem(): void {
    this.menu.push(this.menuGroup());
    this.form.markAsDirty();
  }
  removeMenuItem(i: number): void {
    this.menu.removeAt(i);
    this.form.markAsDirty();
  }
  addCategory(): void {
    this.menuCategories.push(this.textGroup());
    this.form.markAsDirty();
  }
  removeCategory(i: number): void {
    this.menuCategories.removeAt(i);
    this.form.markAsDirty();
  }
  addHours(): void {
    this.hours.push(this.hoursGroup());
    this.form.markAsDirty();
  }
  removeHours(i: number): void {
    this.hours.removeAt(i);
    this.form.markAsDirty();
  }
  addAmenity(): void {
    this.amenities.push(this.textGroup());
    this.form.markAsDirty();
  }
  removeAmenity(i: number): void {
    this.amenities.removeAt(i);
    this.form.markAsDirty();
  }

  private buildDocument(): SiteDocument {
    const raw = this.form.getRawValue();
    const shared = {
      branding: raw.branding,
      hero: raw.hero,
      about: raw.about,
      events: raw.events as SiteEvent[],
      gallery: (raw.gallery as { url: string }[]).map((g) => g.url).filter((u) => !!u),
      contact: raw.contact,
    };

    if (this.isRestaurant()) {
      return {
        template: 'restaurant-v1',
        ...shared,
        menuCategories: (raw.menuCategories as { value: string }[])
          .map((c) => c.value.trim())
          .filter((c) => !!c),
        menu: raw.menu as MenuItem[],
        hours: raw.hours as OpeningHours[],
        amenities: (raw.amenities as { value: string }[])
          .map((a) => a.value.trim())
          .filter((a) => !!a),
        orderUrl: raw.orderUrl,
        sections: {
          hero: raw.sections.hero,
          about: raw.sections.about,
          menu: raw.sections.menu,
          hours: raw.sections.hours,
          amenities: raw.sections.amenities,
          events: raw.sections.events,
          gallery: raw.sections.gallery,
          contact: raw.sections.contact,
        },
      };
    }

    return {
      template: 'marketing-v1',
      ...shared,
      sections: {
        hero: raw.sections.hero,
        about: raw.sections.about,
        events: raw.sections.events,
        gallery: raw.sections.gallery,
        contact: raw.sections.contact,
      },
    };
  }

  save(publish?: boolean): void {
    if (this.form.invalid || this.saving() || !this.canManage) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    const published = publish ?? this.published();
    this.service.updateMine({ content: this.buildDocument(), published }).subscribe({
      next: (site) => {
        this.published.set(site.published);
        this.form.markAsPristine();
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
