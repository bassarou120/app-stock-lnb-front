import { Routes } from '@angular/router';

export default [

  {
    path: '',
    loadComponent: () => import('./entree/entree.component').then(c => c.EntreeComponent),
  },
  {
    path: 'entrees',
    loadComponent: () => import('./entree/entree.component').then(c => c.EntreeComponent),
  },
  {
    path: 'sorties',
    loadComponent: () => import('./sortie/sortie.component').then(c => c.SortieComponent),
  },
] as Routes;
