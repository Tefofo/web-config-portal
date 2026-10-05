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
  templateUrl: './events.component.html',
})
export class EventsComponent implements OnDestroy {
  readonly events = input.required<SiteEvent[]>();

  private readonly now = signal(Date.now());
  private readonly timer = setInterval(() => this.now.set(Date.now()), 1000);

  readonly nextEvent = computed(() => {
    const upcoming = this.events()
      .filter((e) => e.date && new Date(e.date).getTime() > this.now())
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
