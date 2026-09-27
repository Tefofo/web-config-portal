import { Component } from '@angular/core';

/** Shown at the root path; explains how to view a tenant's site. */
@Component({
  selector: 'app-landing',
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-50 p-6 text-center">
      <div class="max-w-md">
        <h1 class="text-2xl font-semibold text-gray-900">Site Renderer</h1>
        <p class="mt-3 text-gray-600">
          Open a published site at <code class="rounded bg-gray-200 px-1">/site/&lt;slug&gt;</code>,
          for example
          <a class="text-blue-600 underline" href="/site/demo-co">/site/demo-co</a>.
        </p>
      </div>
    </div>
  `,
})
export class LandingComponent {}
