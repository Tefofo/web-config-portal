import { Component, input } from '@angular/core';
import { OpeningHours } from '../site-document';

@Component({
  selector: 'app-hours',
  template: `
    <section id="hours" class="bg-gray-50 py-16">
      <div class="mx-auto max-w-3xl px-6 text-center">
        <h2 class="text-3xl font-bold" [style.color]="'var(--brand-primary)'">Opening Hours</h2>
        <div class="mx-auto mt-8 max-w-md divide-y rounded-2xl bg-white shadow-sm">
          @for (row of hours(); track row.days) {
            <div class="flex items-center justify-between px-6 py-4">
              <span class="font-medium text-gray-900">{{ row.days }}</span>
              <span class="text-gray-600">{{ row.time }}</span>
            </div>
          } @empty {
            <p class="px-6 py-4 text-gray-500">Hours not set.</p>
          }
        </div>
      </div>
    </section>
  `,
})
export class HoursComponent {
  readonly hours = input.required<OpeningHours[]>();
}
