import { Component, input } from '@angular/core';

@Component({
  selector: 'app-gallery',
  template: `
    <section id="gallery" class="bg-white py-20">
      <div class="mx-auto max-w-6xl px-6">
        <h2 class="text-center text-3xl font-bold" [style.color]="'var(--brand-primary)'">Gallery</h2>
        <div class="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
          @for (image of images(); track image) {
            <img
              [src]="image"
              alt="Gallery image"
              class="h-48 w-full rounded-xl object-cover shadow-sm transition hover:scale-[1.02]"
              loading="lazy"
            />
          } @empty {
            <p class="col-span-full text-center text-gray-500">No gallery images yet.</p>
          }
        </div>
      </div>
    </section>
  `,
})
export class GalleryComponent {
  readonly images = input.required<string[]>();
}
