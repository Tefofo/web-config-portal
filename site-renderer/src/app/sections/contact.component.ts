import { Component, computed, input } from '@angular/core';
import { SiteContact } from '../site-document';

@Component({
  selector: 'app-contact',
  templateUrl: './contact.component.html',
})
export class ContactComponent {
  readonly contact = input.required<SiteContact>();
  /** Optional "Order Online" link (restaurant template). */
  readonly orderUrl = input<string>('');

  readonly socials = computed(() => {
    const c = this.contact();
    return [
      { label: 'Instagram', url: c.instagram },
      { label: 'Facebook', url: c.facebook },
      { label: 'Twitter', url: c.twitter },
    ].filter((s) => !!s.url);
  });
}
