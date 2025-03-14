import { Routes } from '@angular/router';

export default [

  {
    path: '',
    loadComponent: () => import('./bureaux/bureaux.component').then(c => c.BureauxComponent),
  },
  {
    path: 'bureaux',
    loadComponent: () => import('./bureaux/bureaux.component').then(c => c.BureauxComponent),
  },
  {
    path: 'magazins',
    loadComponent: () => import('./magazins/magazins.component').then(c => c.MagazinsComponent),
  },
  {
    path: 'type-affectation',
    loadComponent: () => import('./type-affectation/type-affectation.component').then(c => c.TypeAffectationComponent),
  },
] as Routes;
