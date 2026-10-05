import { Component, input } from '@angular/core';
import { OpeningHours } from '../site-document';

@Component({
  selector: 'app-hours',
  templateUrl: './hours.component.html',
})
export class HoursComponent {
  readonly hours = input.required<OpeningHours[]>();
}
