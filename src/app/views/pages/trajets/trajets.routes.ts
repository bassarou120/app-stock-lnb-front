import { Routes } from '@angular/router';

export default [

  {
    path: '',
    loadComponent: () => import('./trajets.component').then(c => c.TransfertComponent),
  },
  {
    path: 'transfert',
    loadComponent: () => import('./trajets.component').then(c => c.TransfertComponent),
  },
] as Routes;
