import { Routes } from '@angular/router';

export default [
    {
    path: '',
    loadComponent: () => import('./assurance-a-terme.component').then(c => c.AssuranceATermeComponent),
  },
    {
        path: 'assurance-a-terme',
        loadComponent: () => import('./assurance-a-terme.component').then(c => c.AssuranceATermeComponent),
    }
] as Routes;
