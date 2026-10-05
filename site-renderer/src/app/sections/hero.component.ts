import { Component, input } from '@angular/core';
import { SiteHero } from '../site-document';

@Component({
  selector: 'app-hero',
  templateUrl: './hero.component.html',
})
export class HeroComponent {
  readonly hero = input.required<SiteHero>();
}
