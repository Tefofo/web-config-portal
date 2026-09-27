import { Component, OnDestroy, computed, input, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { SiteEvent } from '../site-document';

interface Countdown {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

@Component({
  selector: 'app-events',
  imports: [DatePipe],
  template: `
    <section id="events" class="bg-gray-50 py-20">
      <div class="mx-auto max-w-6xl px-6">
        <h2 class="text-center text-3xl font-bold" [style.color]="'var(--brand-primary)'">
          Upcoming Events
        </h2>

        @if (nextEvent(); as next) {
          <div class="mx-auto mt-10 max-w-2xl rounded-2xl bg-white p-8 text-center shadow-md">
            <p class="text-sm font-semibold uppercase tracking-wide text-gray-500">Next event in</p>
            <div class="mt-4 flex justify-center gap-4">
              @for (unit of countdownUnits(); track unit.label) {
                <div class="flex flex-col">
                  <span
                    class="rounded-lg px-4 py-2 text-2xl font-bold text-white sm:text-3xl"
                    [style.background-color]="'var(--brand-primary)'"
                  >{{ unit.value }}</span>
                  <span class="mt-1 text-xs uppercase text-gray-500">{{ unit.label }}</span>
                </div>
              }
            </div>
            <p class="mt-4 text-lg font-semibold text-gray-900">{{ next.title }}</p>
            <p class="text-gray-600">{{ next.date | date: 'fullDate' }} · {{ next.venue }}</p>
          </div>
        }

        <div class="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          @for (event of events(); track event.title + event.date) {
            <div class="flex flex-col rounded-2xl bg-white p-6 shadow-sm">
              <p class="text-sm font-semibold" [style.color]="'var(--brand-secondary)'">
                {{ event.date | date: 'mediumDate' }}
              </p>
              <h3 class="mt-2 text-xl font-bold text-gray-900">{{ event.title }}</h3>
              <p class="mt-1 text-gray-500">{{ event.venue }}</p>
              @if (event.description) {
                <p class="mt-3 flex-1 text-gray-600">{{ event.description }}</p>
              }
              @if (event.ticketUrl) {
                <a
                  [href]="event.ticketUrl"
                  class="mt-4 inline-block rounded-full px-5 py-2 text-center text-sm font-semibold text-white transition hover:opacity-90"
                  [style.background-color]="'var(--brand-secondary)'"
                >Get Tickets</a>
              }
            </div>
          } @empty {
            <p class="col-span-full text-center text-gray-500">No events announced yet. Check back soon.</p>
          }
        </div>
      </div>
    </section>
  `,
})
export class EventsComponent implements OnDestroy {
  readonly events = input.required<SiteEvent[]>();

  private readonly now = signal(Date.now());
  private readonly timer = setInterval(() => this.now.set(Date.now()), 1000);

  readonly nextEvent = computed(() => {
    const upcoming = this.events()
      .filter((e) => new Date(e.date).getTime() > this.now())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return upcoming[0] ?? null;
  });

  readonly countdownUnits = computed(() => {
    const next = this.nextEvent();
    const c = next ? this.diff(new Date(next.date).getTime() - this.now()) : null;
    if (!c) return [];
    return [
      { label: 'days', value: c.days },
      { label: 'hrs', value: c.hours },
      { label: 'min', value: c.minutes },
      { label: 'sec', value: c.seconds },
    ];
  });

  ngOnDestroy(): void {
    clearInterval(this.timer);
  }

  private diff(ms: number): Countdown {
    const clamped = Math.max(0, ms);
    const seconds = Math.floor(clamped / 1000);
    return {
      days: Math.floor(seconds / 86400),
      hours: Math.floor((seconds % 86400) / 3600),
      minutes: Math.floor((seconds % 3600) / 60),
      seconds: seconds % 60,
    };
  }
}
