import { Routes } from '@angular/router';

export default [

  {
    path: '',
    loadComponent: () => import('./utilisateurs.component').then(c => c.UtilisateurComponent),
  },
  {
    path: 'utilisateurs',
    loadComponent: () => import('./utilisateurs.component').then(c => c.UtilisateurComponent),
  },
] as Routes;
