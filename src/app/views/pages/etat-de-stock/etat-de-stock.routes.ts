import { Routes } from '@angular/router';

export default [
    {
        path: '',
        loadComponent: () => import('./etat-de-stock.component').then(c => c.EtatStockComponent),
    }
] as Routes;
