import { Routes } from '@angular/router';

export default [

  {
    path: '',
    loadComponent: () => import('./categories.component').then(c => c.CategorieComponent),
  },
  {
    path: 'categories',
    loadComponent: () => import('./categories.component').then(c => c.CategorieComponent),
  },
] as Routes;
