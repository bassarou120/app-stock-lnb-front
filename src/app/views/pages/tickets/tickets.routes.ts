import { Routes } from '@angular/router';

export default [

  {
    path: '',
    loadComponent: () => import('./etat-de-stock/etat-de-stock.component').then(c => c.EtatStockComponent),
  },
  {
    path: 'entree',
    loadComponent: () => import('./entree/entree.component').then(c => c.EntreeComponent),
  },
  {
    path: 'attribution',
    loadComponent: () => import('./attribution/sortie.component').then(c => c.SortieComponent),
  },
  {
    path: 'stock',
    loadComponent: () => import('./etat-de-stock/etat-de-stock.component').then(c => c.EtatStockComponent),
  },
] as Routes;
