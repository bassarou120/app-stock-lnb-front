import { Routes } from '@angular/router';

export default [
    {
    path: '',
    loadComponent: () => import('./visite-technique-avenir.component').then(c => c.VisteTechniqueAVenir),
  },
    {
        path: 'assurance-a-terme',
        loadComponent: () => import('./visite-technique-avenir.component').then(c => c.VisteTechniqueAVenir),
    }
] as Routes;
