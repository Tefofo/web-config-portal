import { Component, input } from '@angular/core';
import { SiteAbout } from '../site-document';

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
})
export class AboutComponent {
  readonly about = input.required<SiteAbout>();
}
