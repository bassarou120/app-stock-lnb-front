import { Routes } from '@angular/router';

export default [

  {
    path: '',
    loadComponent: () => import('./transfert.component').then(c => c.TransfertComponent),
  },
  {
    path: 'transfert',
    loadComponent: () => import('./transfert.component').then(c => c.TransfertComponent),
  },
] as Routes;
