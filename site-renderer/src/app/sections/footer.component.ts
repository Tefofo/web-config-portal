import { Component, input } from '@angular/core';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
})
export class FooterComponent {
  readonly siteName = input.required<string>();
  readonly year = new Date().getFullYear();
}
