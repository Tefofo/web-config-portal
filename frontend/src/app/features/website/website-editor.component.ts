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
import { SiteDocument, SiteEvent } from '../../core/models/site.model';

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

  constructor() {
    this.load();
    if (!this.canManage) {
      this.form.disable();
    }
  }

  private load(): void {
    this.loading.set(true);
    this.service.getMine().subscribe({
      next: (site) => {
        this.slug.set(site.slug);
        this.published.set(site.published);
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
    content.events.forEach((e) => this.events.push(this.eventGroup(e)));
    content.gallery.forEach((url) => this.gallery.push(this.galleryGroup(url)));
    this.form.patchValue({
      branding: content.branding,
      hero: content.hero,
      about: content.about,
      contact: content.contact,
      sections: content.sections,
    });
  }

  private eventGroup(e?: SiteEvent): FormGroup {
    return this.fb.nonNullable.group({
      title: [e?.title ?? '', Validators.required],
      date: [e?.date ?? '', Validators.required],
      venue: [e?.venue ?? ''],
      description: [e?.description ?? ''],
      ticketUrl: [e?.ticketUrl ?? ''],
    });
  }

  private galleryGroup(url = ''): FormGroup {
    return this.fb.nonNullable.group({ url: [url] });
  }

  addEvent(): void {
    this.events.push(this.eventGroup());
    this.form.markAsDirty();
  }
  removeEvent(index: number): void {
    this.events.removeAt(index);
    this.form.markAsDirty();
  }
  addImage(): void {
    this.gallery.push(this.galleryGroup());
    this.form.markAsDirty();
  }
  removeImage(index: number): void {
    this.gallery.removeAt(index);
    this.form.markAsDirty();
  }

  private buildDocument(): SiteDocument {
    const raw = this.form.getRawValue();
    return {
      branding: raw.branding,
      hero: raw.hero,
      about: raw.about,
      events: raw.events as SiteEvent[],
      gallery: (raw.gallery as { url: string }[]).map((g) => g.url).filter((u) => !!u),
      contact: raw.contact,
      sections: raw.sections,
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
