import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'site/:slug',
    loadComponent: () => import('./site-page/site-page.component').then((m) => m.SitePageComponent),
  },
  {
    path: '',
    loadComponent: () => import('./landing/landing.component').then((m) => m.LandingComponent),
  },
  { path: '**', redirectTo: '' },
];
