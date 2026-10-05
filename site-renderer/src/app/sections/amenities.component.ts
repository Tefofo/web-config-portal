import { Component, input } from '@angular/core';

@Component({
  selector: 'app-amenities',
  templateUrl: './amenities.component.html',
})
export class AmenitiesComponent {
  readonly amenities = input.required<string[]>();
}
