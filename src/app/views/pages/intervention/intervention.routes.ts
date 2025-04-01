import { Routes } from '@angular/router';

export default [

  {
    path: '',
    loadComponent: () => import('./intervention.component').then(c => c.InterventionComponent),
  },
  {
    path: 'intervention',
    loadComponent: () => import('./intervention.component').then(c => c.InterventionComponent),
  },
] as Routes;
