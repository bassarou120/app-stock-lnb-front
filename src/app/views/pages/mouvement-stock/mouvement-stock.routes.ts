import { Routes } from '@angular/router';

export default [

  {
    path: '',
    loadComponent: () => import('./entree/entree.component').then(c => c.EntreeComponent),
  },
  {
    path: 'entrees',
    loadComponent: () => import('./entree/entree.component').then(c => c.EntreeComponent),
  },
  {
    path: 'sorties',
    loadComponent: () => import('./sortie/sortie.component').then(c => c.SortieComponent),
  },
  {
    path: 'demande',
    loadComponent: () => import('./demande-old/demande-old.component').then(c => c.SortieComponent),
  },
  {
    path: 'exercice',
    loadComponent: () => import('./exercice/exercice.component').then(c => c.ExerciceComponent),
  },
  {
    path: 'les-demandes',
    loadComponent: () => import('./les-demandes/les-demandes.component').then(c => c.SortieStockGroupedComponent),
  },
  {
    path: 'articles-exercices',
    loadComponent: () => import('./articles-exercices/articles-exercices.component').then(c => c.ArticleExerciceComponent),
  },
] as Routes;
