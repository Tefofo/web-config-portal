import { Component, effect, inject, input } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTabsModule } from '@angular/material/tabs';
import {
  MenuItem,
  OpeningHours,
  RestaurantSiteDocument,
  SiteEvent,
} from '../../../core/models/site.model';
import { TemplateEditor } from '../site-editor';

/** Editor form for the restaurant-v1 template. Owns its own reactive form. */
@Component({
  selector: 'app-restaurant-editor',
  imports: [
    ReactiveFormsModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
  ],
  templateUrl: './restaurant-editor.component.html',
  styleUrl: '../website-editor.component.scss',
})
export class RestaurantEditorComponent implements TemplateEditor {
  private readonly fb = inject(FormBuilder);

  readonly initial = input.required<RestaurantSiteDocument>();
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
    effect(() => {
      this.patch(this.initial());
      if (!this.canManage()) {
        this.form.disable();
      }
    });
  }

  private patch(content: RestaurantSiteDocument): void {
    this.events.clear();
    this.gallery.clear();
    this.menu.clear();
    this.menuCategories.clear();
    this.hours.clear();
    this.amenities.clear();

    content.events.forEach((e) => this.events.push(this.eventGroup(e)));
    content.gallery.forEach((url) => this.gallery.push(this.galleryGroup(url)));
    content.menuCategories.forEach((c) => this.menuCategories.push(this.textGroup(c)));
    content.menu.forEach((m) => this.menu.push(this.menuGroup(m)));
    content.hours.forEach((h) => this.hours.push(this.hoursGroup(h)));
    content.amenities.forEach((a) => this.amenities.push(this.textGroup(a)));
    this.form.controls.orderUrl.setValue(content.orderUrl);

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

  buildDocument(): RestaurantSiteDocument {
    const raw = this.form.getRawValue();
    return {
      template: 'restaurant-v1',
      branding: raw.branding,
      hero: raw.hero,
      about: raw.about,
      menuCategories: (raw.menuCategories as { value: string }[])
        .map((c) => c.value.trim())
        .filter((c) => !!c),
      menu: raw.menu as MenuItem[],
      hours: raw.hours as OpeningHours[],
      amenities: (raw.amenities as { value: string }[]).map((a) => a.value.trim()).filter((a) => !!a),
      orderUrl: raw.orderUrl,
      events: raw.events as SiteEvent[],
      gallery: (raw.gallery as { url: string }[]).map((g) => g.url).filter((u) => !!u),
      contact: raw.contact,
      sections: raw.sections,
    };
  }
}
