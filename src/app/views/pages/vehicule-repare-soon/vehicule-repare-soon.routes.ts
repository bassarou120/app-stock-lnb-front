import { Routes } from '@angular/router';

export default [
    {
    path: '',
    loadComponent: () => import('./vehicule-repare-soon.component').then(c => c.VehiculeRepareSoon),
  },
    {
        path: 'assurance-a-terme',
        loadComponent: () => import('./vehicule-repare-soon.component').then(c => c.VehiculeRepareSoon),
    }
] as Routes;
