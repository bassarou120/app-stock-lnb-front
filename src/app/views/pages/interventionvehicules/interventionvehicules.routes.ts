import { Routes } from '@angular/router';

export default [
  {
    path: '',
    loadComponent: () => import('./interventionvehicules.component').then(c => c.InterventionVehiculeComponent), // Correction du nom du composant
  },
  {
    path: 'intervention',
    loadComponent: () => import('./interventionvehicules.component').then(c => c.InterventionVehiculeComponent), // Correction du nom du composant
  },
] as Routes;
