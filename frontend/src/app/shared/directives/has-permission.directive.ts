import {
  Directive,
  effect,
  inject,
  input,
  TemplateRef,
  ViewContainerRef,
} from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';
import { Permission } from '../../core/models/role.model';

/**
 * Structural directive that renders its content only when the current user
 * holds at least one of the given permissions.
 *
 * Usage: `<button *appHasPermission="'configuration:create'">New</button>`
 * or an array: `*appHasPermission="['user:manage','role:manage']"`.
 *
 * This shapes the UI only — route guards and the backend enforce real
 * authorization.
 */
@Directive({
  selector: '[appHasPermission]',
})
export class HasPermissionDirective {
  private readonly auth = inject(AuthService);
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);
  private visible = false;

  readonly appHasPermission = input.required<Permission | Permission[]>();

  constructor() {
    effect(() => {
      const required = this.appHasPermission();
      const list = Array.isArray(required) ? required : [required];
      // Access permissions signal so this re-runs on auth changes.
      const allowed = this.auth.hasAnyPermission(list) && this.auth.isAuthenticated();
      if (allowed && !this.visible) {
        this.viewContainer.createEmbeddedView(this.templateRef);
        this.visible = true;
      } else if (!allowed && this.visible) {
        this.viewContainer.clear();
        this.visible = false;
      }
    });
  }
}
