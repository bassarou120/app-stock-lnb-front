import { Routes } from '@angular/router';

export default [
  // {
  //   path: '',
  //   loadComponent: () => import('./parametres.component').then(c => c.ParametresComponent),
  // },
    { path: '', redirectTo: 'basic-tables', pathMatch: 'full' },
  {
    path: 'fournisseurs',
    loadComponent: () => import('./fournisseurs/fournisseurs.component').then(c => c.FournisseursComponent),
  },
  {
    path: 'employes',
    loadComponent: () => import('./employes/employes.component').then(c => c.EmployesComponent),
  },
  {
    path: 'types-intervention',
    loadComponent: () => import('./types-intervention/types-intervention.component').then(c => c.TypesInterventionComponent),
  },
  {
    path: 'type-mouvement',
    loadComponent: () => import('./types-mouvement/types-mouvement.component').then(c => c.TypeMouvementComponent),
  },

] as Routes;
