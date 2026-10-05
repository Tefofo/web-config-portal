import { Component, input } from '@angular/core';
import { MarketingSiteDocument } from '../../site-document';
import { HeroComponent } from '../../sections/hero.component';
import { AboutComponent } from '../../sections/about.component';
import { EventsComponent } from '../../sections/events.component';
import { GalleryComponent } from '../../sections/gallery.component';
import { ContactComponent } from '../../sections/contact.component';

/** Composes the marketing-v1 section layout from a marketing site document. */
@Component({
  selector: 'app-marketing-template',
  imports: [HeroComponent, AboutComponent, EventsComponent, GalleryComponent, ContactComponent],
  templateUrl: './marketing-template.component.html',
})
export class MarketingTemplateComponent {
  readonly document = input.required<MarketingSiteDocument>();
}
