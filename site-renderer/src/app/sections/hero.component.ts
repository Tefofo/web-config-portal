import { Component, input } from '@angular/core';
import { SiteHero } from '../site-document';

@Component({
  selector: 'app-hero',
  template: `
    <section
      id="hero"
      class="relative flex min-h-[70vh] items-center justify-center bg-gray-900 text-white"
      [style.background-image]="hero().backgroundImageUrl ? 'url(' + hero().backgroundImageUrl + ')' : null"
      style="background-size: cover; background-position: center;"
    >
      <div class="absolute inset-0 bg-black/50"></div>
      <div class="relative z-10 mx-auto max-w-3xl px-6 py-24 text-center">
        <h1 class="text-4xl font-bold tracking-tight sm:text-6xl">{{ hero().headline }}</h1>
        @if (hero().subheadline) {
          <p class="mx-auto mt-6 max-w-2xl text-lg text-gray-200">{{ hero().subheadline }}</p>
        }
        @if (hero().ctaLabel) {
          <a
            [href]="hero().ctaUrl || '#'"
            class="mt-10 inline-block rounded-full px-8 py-3 text-base font-semibold text-white shadow-lg transition hover:opacity-90"
            [style.background-color]="'var(--brand-secondary)'"
          >
            {{ hero().ctaLabel }}
          </a>
        }
      </div>
    </section>
  `,
})
export class HeroComponent {
  readonly hero = input.required<SiteHero>();
}
