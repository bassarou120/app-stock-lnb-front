import { Routes } from '@angular/router';

export default [

  {
    path: '',
    loadComponent: () => import('./enregistrement-immos.component').then(c => c.ImmobilisationComponent),
  },
  {
    path: 'enregistrement-immos',
    loadComponent: () => import('./enregistrement-immos.component').then(c => c.ImmobilisationComponent),
  },
] as Routes;
