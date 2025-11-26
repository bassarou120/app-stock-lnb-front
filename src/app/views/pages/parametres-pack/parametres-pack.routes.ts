import { Routes } from '@angular/router';

export default [
  // {
  //   path: '',
  //   loadComponent: () => import('./parametres-pack.component').then(c => c.ParametresPackComponent),
  // },
  {
    path: '',
    loadComponent: () => import('./marques/marques.component').then(c => c.MarquesComponent),
  },
  {
    path: 'marques',
    loadComponent: () => import('./marques/marques.component').then(c => c.MarquesComponent),
  },
  {
    path: 'modeles',
    loadComponent: () => import('./modeles/modeles.component').then(c => c.ModelesComponent),
  },
  {
    path: 'communes',
    loadComponent: () => import('./communes/communes.component').then(c => c.CommunesComponent),
  },
  {
    path: 'coupon-ticket',
    loadComponent: () => import('./coupon-tickets/coupon-tickets.component').then(c => c.CouponTicketsComponent),
  },
  {
    path: 'compagnie-petroliere',
    loadComponent: () => import('./compagnie-petroliere/compagnie-petroliere.component').then(c => c.CompagniePetroliereComponent),
  },
  {
    path: 'categorie-sortie-ticket',
    loadComponent: () => import('./categorie-sortie-ticket/categorie-sortie-ticket.component').then(c => c.CategorieSortieTicketComponent),
  }
  ,
  {
    path: 'trajets',
    loadComponent: () => import('./trajets/trajets.component').then(c => c.TrajetComponent),
  },
  {
    path: 'exercice-mouvementticket',
    loadComponent: () => import('./exercice-mouvementticket/exercice-mouvementticket.component').then(c => c.ExerciceMouvementTicketComponent),
  },
] as Routes;
