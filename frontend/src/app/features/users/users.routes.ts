import { Routes } from '@angular/router';

// Detailed routes are implemented in Phase 3.
export const usersRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./user-list.component').then((m) => m.UserListComponent),
    title: 'Users',
  },
];
