import { Routes } from '@angular/router';
import { permissionGuard } from '../../core/guards/permission.guard';
import { unsavedChangesGuard } from '../../core/guards/unsaved-changes.guard';

export const configurationRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./configuration-list.component').then((m) => m.ConfigurationListComponent),
    title: 'Configurations',
  },
  {
    path: 'new',
    canActivate: [permissionGuard('configuration:create')],
    canDeactivate: [unsavedChangesGuard],
    loadComponent: () =>
      import('./configuration-form.component').then((m) => m.ConfigurationFormComponent),
    title: 'New Configuration',
  },
  {
    path: ':id/edit',
    canActivate: [permissionGuard('configuration:edit')],
    canDeactivate: [unsavedChangesGuard],
    loadComponent: () =>
      import('./configuration-form.component').then((m) => m.ConfigurationFormComponent),
    title: 'Edit Configuration',
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./configuration-detail.component').then((m) => m.ConfigurationDetailComponent),
    title: 'Configuration Details',
  },
];
