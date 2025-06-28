import { Routes } from '@angular/router';

export default [
    {
        path: 'stock',
        loadComponent: () => import('./stock/rapport-stock.component').then(c => c.RapportStockComponent),
    },
    {
        path: 'immo',
        loadComponent: () => import('./immo/rapport-immobilisations.component').then(c => c.RapportImmobilisationsComponent),
    },
    {
        path: 'parc',
        loadComponent: () => import('./parc/rapport-parc.component').then(c => c.RapportParcComponent),
    },
    {
        path: 'ticket',
        loadComponent: () => import('./ticket/rapport-ticket.component').then(c => c.RapportTicketComponent),
    },
] as Routes;
