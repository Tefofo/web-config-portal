import { Component, input } from '@angular/core';
import { SiteAbout } from '../site-document';

@Component({
  selector: 'app-about',
  template: `
    <section id="about" class="bg-white py-20">
      <div class="mx-auto grid max-w-6xl items-center gap-12 px-6 md:grid-cols-2">
        <div>
          <h2 class="text-3xl font-bold text-gray-900" [style.color]="'var(--brand-primary)'">
            {{ about().heading }}
          </h2>
          <p class="mt-6 whitespace-pre-line text-lg leading-relaxed text-gray-600">
            {{ about().body }}
          </p>
        </div>
        @if (about().imageUrl) {
          <img
            [src]="about().imageUrl"
            [alt]="about().heading"
            class="h-80 w-full rounded-2xl object-cover shadow-md"
            loading="lazy"
          />
        }
      </div>
    </section>
  `,
})
export class AboutComponent {
  readonly about = input.required<SiteAbout>();
}
