import { Component, computed, input } from '@angular/core';
import { MenuItem } from '../site-document';

interface MenuGroup {
  category: string;
  items: MenuItem[];
}

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
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
    for (const item of items) {
      if (!seen.has(item.category)) {
        seen.add(item.category);
        groups.push({
          category: item.category,
          items: items.filter((i) => i.category === item.category),
        });
      }
    }
    return groups;
  });
}
