import { Component, effect, inject, input } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTabsModule } from '@angular/material/tabs';
import { MarketingSiteDocument, SiteEvent } from '../../../core/models/site.model';
import { TemplateEditor } from '../site-editor';

/** Editor form for the marketing-v1 template. Owns its own reactive form. */
@Component({
  selector: 'app-marketing-editor',
  imports: [
    ReactiveFormsModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
  ],
  templateUrl: './marketing-editor.component.html',
  styleUrl: '../website-editor.component.scss',
})
export class MarketingEditorComponent implements TemplateEditor {
  private readonly fb = inject(FormBuilder);

  readonly initial = input.required<MarketingSiteDocument>();
  readonly canManage = input<boolean>(true);

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
    effect(() => {
      this.patch(this.initial());
      if (!this.canManage()) {
        this.form.disable();
      }
    });
  }

  private patch(content: MarketingSiteDocument): void {
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
    this.form.markAsPristine();
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

  // --- TemplateEditor ---
  isValid(): boolean {
    return this.form.valid;
  }
  markAllTouched(): void {
    this.form.markAllAsTouched();
  }
  isDirty(): boolean {
    return this.form.dirty;
  }
  markPristine(): void {
    this.form.markAsPristine();
  }

  buildDocument(): MarketingSiteDocument {
    const raw = this.form.getRawValue();
    return {
      template: 'marketing-v1',
      branding: raw.branding,
      hero: raw.hero,
      about: raw.about,
      events: raw.events as SiteEvent[],
      gallery: (raw.gallery as { url: string }[]).map((g) => g.url).filter((u) => !!u),
      contact: raw.contact,
      sections: raw.sections,
    };
  }
}
