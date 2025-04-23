import { Routes } from '@angular/router';

export default [

  {
    path: '',
    loadComponent: () => import('./trajets.component').then(c => c.TrajetComponent),
  },
  {
    path: 'trajets',
    loadComponent: () => import('./trajets.component').then(c => c.TrajetComponent),
  },
] as Routes;
