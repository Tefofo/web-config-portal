import { Component, computed, input } from '@angular/core';
import { MenuItem } from '../site-document';

interface MenuGroup {
  category: string;
  items: MenuItem[];
}

@Component({
  selector: 'app-menu',
  template: `
    <section id="menu" class="bg-white py-20">
      <div class="mx-auto max-w-5xl px-6">
        <h2 class="text-center text-3xl font-bold" [style.color]="'var(--brand-primary)'">Menu</h2>

        @for (group of groups(); track group.category) {
          <div class="mt-12">
            <h3
              class="mb-6 border-b pb-2 text-xl font-semibold uppercase tracking-wide"
              [style.color]="'var(--brand-secondary)'"
              [style.border-color]="'var(--brand-secondary)'"
            >
              {{ group.category }}
            </h3>
            <ul class="space-y-5">
              @for (item of group.items; track item.name) {
                <li class="flex items-start justify-between gap-4">
                  <div>
                    <p class="font-semibold text-gray-900">
                      {{ item.name }}
                      @if (item.tag) {
                        <span
                          class="ml-2 rounded-full px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-white"
                          [style.background-color]="'var(--brand-secondary)'"
                        >{{ item.tag }}</span>
                      }
                    </p>
                    @if (item.description) {
                      <p class="mt-1 text-sm text-gray-500">{{ item.description }}</p>
                    }
                  </div>
                  <span class="whitespace-nowrap font-semibold text-gray-900">
                    R{{ item.price }}
                  </span>
                </li>
              }
            </ul>
          </div>
        } @empty {
          <p class="mt-8 text-center text-gray-500">Menu coming soon.</p>
        }
      </div>
    </section>
  `,
})
export class MenuComponent {
  readonly menu = input.required<MenuItem[]>();
  /** Category display order; items in unknown categories are appended. */
  readonly categories = input<string[]>([]);

  readonly groups = computed<MenuGroup[]>(() => {
    const items = this.menu();
    const ordered = this.categories();
    const seen = new Set<string>();
    const groups: MenuGroup[] = [];

    for (const category of ordered) {
      const inCat = items.filter((i) => i.category === category);
      if (inCat.length) {
        groups.push({ category, items: inCat });
        seen.add(category);
      }
    }
    // Any categories present on items but not in the ordered list.
    for (const item of items) {
      if (!seen.has(item.category)) {
        seen.add(item.category);
        groups.push({ category: item.category, items: items.filter((i) => i.category === item.category) });
      }
    }
    return groups;
  });
}
