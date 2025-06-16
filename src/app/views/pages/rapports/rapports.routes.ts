import { Routes } from '@angular/router';

export default [
    {
        path: 'stock',
        loadComponent: () => import('./stock/stock.component').then(c => c.StockComponent),
    },
    {
        path: 'immo',
        loadComponent: () => import('./immo/immo.component').then(c => c.ImmoComponent),
    },
    {
        path: 'parc',
        loadComponent: () => import('./parc/parc.component').then(c => c.ParcComponent),
    },
] as Routes;
