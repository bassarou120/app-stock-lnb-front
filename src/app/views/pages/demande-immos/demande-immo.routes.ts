import { Routes } from '@angular/router';

export default [

  {
    path: '',
    loadComponent: () => import('./demande-immo.component').then(c => c.DemandeImmoComponent),
  },
  {
    path: 'demande-immos',
    loadComponent: () => import('./demande-immo.component').then(c => c.DemandeImmoComponent),
  },
] as Routes;
