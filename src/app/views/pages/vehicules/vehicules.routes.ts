import { Routes } from '@angular/router';

export default [

  {
    path: '',
    loadComponent: () => import('./vehicules.component').then(c => c.VehiculesComponent),
  },
  {
    path: 'vehicules',
    loadComponent: () => import('./vehicules.component').then(c => c.VehiculesComponent),
  },
] as Routes;
