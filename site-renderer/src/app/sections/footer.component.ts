import { Component, input } from '@angular/core';

@Component({
  selector: 'app-footer',
  template: `
    <footer class="bg-gray-950 py-8 text-center text-sm text-gray-400">
      <p>&copy; {{ year }} {{ siteName() }}. All rights reserved.</p>
    </footer>
  `,
})
export class FooterComponent {
  readonly siteName = input.required<string>();
  readonly year = new Date().getFullYear();
}
