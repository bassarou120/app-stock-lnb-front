import { Routes } from '@angular/router';

export default [

  {
    path: '',
    loadComponent: () => import('./type-immo/type-immo.component').then(c => c.TypeImmoComponent),
  },
  {
    path: 'type-immo',
    loadComponent: () => import('./type-immo/type-immo.component').then(c => c.TypeImmoComponent),
  },
  {
    path: 'sous-type-immo',
    loadComponent: () => import('./sous-type-immo/sous-type-immo.component').then(c => c.SousTypeImmoComponent),
  },
  {
    path: 'groupe-type-immo',
    loadComponent: () => import('./groupe-type-immo/groupe-type-immo.component').then(c => c.GroupeTypeImmoComponent),
  },
  {
    path: 'status-immo',
    loadComponent: () => import('./status-immo/status-immo.component').then(c => c.StatusImmosComponent),
  },
] as Routes;
