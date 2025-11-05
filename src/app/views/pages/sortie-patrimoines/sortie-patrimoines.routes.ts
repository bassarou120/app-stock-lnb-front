import { Routes } from '@angular/router';

export default [

  {
    path: '',
    loadComponent: () => import('./sortie-patrimoines.component').then(c => c.SortiePatrimoinesComponent),
  },
  {
    path: 'sortie-patrimoines',
    loadComponent: () => import('./sortie-patrimoines.component').then(c => c.SortiePatrimoinesComponent),
  },
] as Routes;
