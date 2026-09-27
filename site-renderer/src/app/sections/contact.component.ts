import { Component, computed, input } from '@angular/core';
import { SiteContact } from '../site-document';

@Component({
  selector: 'app-contact',
  template: `
    <section id="contact" class="py-20 text-white" [style.background-color]="'var(--brand-primary)'">
      <div class="mx-auto max-w-3xl px-6 text-center">
        <h2 class="text-3xl font-bold">Get in touch</h2>
        <div class="mt-8 space-y-2 text-lg text-gray-200">
          @if (contact().email) {
            <p><a class="hover:underline" [href]="'mailto:' + contact().email">{{ contact().email }}</a></p>
          }
          @if (contact().phone) {
            <p>{{ contact().phone }}</p>
          }
          @if (contact().address) {
            <p>{{ contact().address }}</p>
          }
        </div>
        @if (socials().length) {
          <div class="mt-8 flex justify-center gap-6">
            @for (s of socials(); track s.label) {
              <a
                [href]="s.url"
                target="_blank"
                rel="noopener"
                class="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold transition hover:bg-white/20"
              >{{ s.label }}</a>
            }
          </div>
        }
      </div>
    </section>
  `,
})
export class ContactComponent {
  readonly contact = input.required<SiteContact>();

  readonly socials = computed(() => {
    const c = this.contact();
    return [
      { label: 'Instagram', url: c.instagram },
      { label: 'Facebook', url: c.facebook },
      { label: 'Twitter', url: c.twitter },
    ].filter((s) => !!s.url);
  });
}
