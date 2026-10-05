import { Component, input } from '@angular/core';
import { RestaurantSiteDocument } from '../../site-document';
import { HeroComponent } from '../../sections/hero.component';
import { AboutComponent } from '../../sections/about.component';
import { MenuComponent } from '../../sections/menu.component';
import { HoursComponent } from '../../sections/hours.component';
import { AmenitiesComponent } from '../../sections/amenities.component';
import { EventsComponent } from '../../sections/events.component';
import { GalleryComponent } from '../../sections/gallery.component';
import { ContactComponent } from '../../sections/contact.component';

/** Composes the restaurant-v1 section layout from a restaurant site document. */
@Component({
  selector: 'app-restaurant-template',
  imports: [
    HeroComponent,
    AboutComponent,
    MenuComponent,
    HoursComponent,
    AmenitiesComponent,
    EventsComponent,
    GalleryComponent,
    ContactComponent,
  ],
  templateUrl: './restaurant-template.component.html',
})
export class RestaurantTemplateComponent {
  readonly document = input.required<RestaurantSiteDocument>();
}
