import { Routes } from '@angular/router';

export default [

  {
    path: '',
    loadComponent: () => import('./site-settings.component').then(c => c.SiteSettingsComponent),
  },
  {
    path: 'site-settings',
    loadComponent: () => import('./site-settings.component').then(c => c.SiteSettingsComponent),
  },
] as Routes;
