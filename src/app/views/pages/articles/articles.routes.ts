import { Routes } from '@angular/router';

export default [

  {
    path: '',
    loadComponent: () => import('./articles.component').then(c => c.ArticlesComponent),
  },
  {
    path: 'articles',
    loadComponent: () => import('./articles.component').then(c => c.ArticlesComponent),
  },
] as Routes;
