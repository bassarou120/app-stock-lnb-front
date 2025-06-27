import { MenuItem } from './menu.model';

export const MENU: MenuItem[] = [

  {
    label: 'Menu principal',
    isTitle: true
  },
  {
    label: 'Tableau de Bord',
    icon: 'home',
    link: '/dashboard'
  },
  {
    label: 'Gestion de Stock',
    isTitle: true,
     module: 'Gestion de Stock',
  },

  {
    label: 'Mouvement Stock',
    icon: 'maximize-2',
    module: 'Gestion de Stock',
    subItems: [
      {
        label: 'Entrées de Stock',
        link: '/mouvement-stock/entrees',
        fonctionnalites: ['Ajout du Stock', 'Modification du Stock']
      },
      {
        label: 'Les demandes',
        link: '/mouvement-stock/les-demandes',
        fonctionnalites: ['Voir Les demandes', 'Validation de demande']
      },
      {
        label: 'Sorties de Stock',
        link: '/mouvement-stock/sorties',
        fonctionnalites: ['Sorties de Stock'],
      }
    ]
  },
  {
    label: 'Etat de Stock',
    icon: 'bar-chart-2',
    link: '/etat-de-stock',
    module: 'Gestion de Stock',
    fonctionnalites: ['Voir Etat de Stock', 'Export Stock']
  },
  {
    label: 'Gestion de Immobilisation',
    isTitle: true,
    module: 'Gestion de immobilisation',

  },
  {
    label: 'Enrégistrement',
    icon: 'download',
    link: '/enregistrement-immos',
    module: 'Gestion de immobilisation',
    fonctionnalites: ['Ajout immobilisation']
  },
  {
    label: 'Affectations/Transfert',
    icon: 'send',
    link: '/transfert',
    module: 'Gestion de immobilisation',
    fonctionnalites: ['Affectation Immobilisation']
  },
  {
    label: 'Intervention',
    icon: 'activity',
    link: '/intervention',
    module: 'Gestion de immobilisation',
    fonctionnalites: ['Intervention Immobilisation']
  },
  {
    label: 'Gestion de Parc',
    isTitle: true,
    module: 'Gestion de parc',
  },
  {
    label: 'Véhicules',
    icon: 'truck',
    link: '/vehicules',
    module: 'Gestion de parc',
    fonctionnalites: ['Ajout vehicule']
  },
  {
    label: 'Intervention Véhicules',
    icon: 'pen-tool',
    link: '/interventionvehicules',
    module: 'Gestion de parc',
    fonctionnalites: ['Ajout Intervention vehicule']
  },
  {
    label: 'Tickets',
    icon: 'credit-card',
    module: 'Gestion de parc',
    subItems: [
      {
        label: 'Attribution de Ticket',
        link: 'tickets/attribution',
        fonctionnalites: ['Attribution ticket']
      },
      {
        label: 'Entrée de Ticket',
        link: 'tickets/entree',
        fonctionnalites: ['Ajout de Ticket']
      },
      {
        label: 'Stock Ticket',
        link: 'tickets/',
        fonctionnalites: ['Verifier Stock Ticket']
      },


      {
        label: 'Retour Tickets',
        link: 'tickets/retour-ticket',
        fonctionnalites: ['Voir Retour Ticket']
      },

      {
        label: 'Annulation de Tickets',
        link: 'tickets/annulation-ticket',
        fonctionnalites: ['Annulation Ticket']
      },
    ]
  },
  {
    label: 'Gestion des utilisateurs',
    isTitle: true,
    module: 'Parametrage',
  },
  {
    label: 'Utilisateurs',
    icon: 'users',
    link: '/utilisateurs',
    module: 'Parametrage',
    fonctionnalites: ['Ajout Parametrage', 'Modification Parametrage', 'Suppression Parametrage']
  },
  {
    label: 'Rôles et Permisions',
    icon: 'user-check',
    module: 'Parametrage',
    // link: ''
    subItems: [
      {
        label: 'Rôles',
        link: '/parametres/roles',
        fonctionnalites: ['Ajout Parametrage']
      },
      {
        label: 'Permissions',
        link: '/parametres/permissions',
        fonctionnalites: ['Modification Parametrage']
      },
    ]
  },
  {
    label: 'Rapports',
    isTitle: true,
    module: 'Gestion Rapport',
  },
  {
    label: 'Rapport Stock',
    icon: 'file',
    link: '/rapports/stock',
    module: 'Gestion Rapport',
    fonctionnalites: ['Rapport Stock']

  },
  {
    label: 'Rapport Immo',
    icon: 'file',
    link: '/rapports/immo',
    module: 'Gestion Rapport',
    fonctionnalites: ['Rapport Immo', 'Export Rapport Immo']
  },
  {
    label: 'Rapport parc',
    icon: 'file',
    link: '/rapports/parc',
    module: 'Gestion Rapport',
    fonctionnalites: ['Rapport Parc', 'Export Parc']
  },
  {
    label: 'Rapport ticket',
    icon: 'file',
    link: '/rapports/ticket',
    module: 'Gestion Rapport',
    fonctionnalites: ['Rapport Ticket', 'Export Ticket']
  },
  {
    label: 'Paramètres',
    isTitle: true,
     module: 'Parametrage',
  },
  {
    label: 'Paramètres Stock',
    icon: 'box',
    module: 'Parametrage',
    subItems: [
      {
        label: 'Articles',
        link: '/parametres-stock/articles',
      },
      {
        label: 'Catégories',
        link: '/parametres-stock/categories',
      },
      {
        label: 'Liste des Bureaux/Localisations',
        link: '/parametres-stock/bureaux',
      },
      {
        label: 'Liste des Magazins',
        link: '/parametres-stock/magazins',
      },
      {
        label: 'Type d\'Affectation',
        link: '/parametres-stock/type-affectation',
      },
      {
        label: 'Unité de mesure',
        link: '/parametres-stock/unite-de-mesure',
      },
    ]
  },
  {
    label: 'Paramètres Parc',
    icon: 'truck',
    module: 'Parametrage',
    subItems: [
      {
        label: 'Marques',
        link: '/parametres-pack/marques',
      },
      {
        label: 'Communes',
        link: '/parametres-pack/communes',
      },
      {
        label: 'Coupon Ticket',
        link: '/parametres-pack/coupon-ticket',
      },
      {
        label: 'Compagnie Pétrolière',
        link: '/parametres-pack/compagnie-petroliere',
      },

      {
        label: 'Trajet',
        icon: 'git-pull-request',
        link: '/parametres-pack/trajets'
      },
      // {
      //   label: 'Liste des Véhicules',
      //   link: '/parametres-pack/vehicules',
      // },
    ]
  },
  {
    label: 'Paramètres Immo',
    icon: 'server',
    module: 'Parametrage',
    subItems: [
      {
        label: 'Type d\'Immo',
        link: '/parametres-immo/type-immo',
      },
      {
        label: 'Sous Type Immo',
        link: '/parametres-immo/sous-type-immo',
      },
      {
        label: 'Groupe Type Immo',
        link: '/parametres-immo/groupe-type-immo',
      },
      {
        label: 'Status Immo',
        link: '/parametres-immo/status-immo',
      },
    ]
  },
  {
    label: 'Paramètres Génér...',
    icon: 'settings',
    module: 'Parametrage',
    subItems: [
      {
        label: 'Paramètre Entreprise',
        link: '/parametres/entreprise',
      },
      {
        label: 'Type Mouvement',
        link: '/parametres/type-mouvement',
      },
      {
        label: 'Liste du Personnel',
        link: '/parametres/employes',
      },
      {
        label: 'Liste des Fournisseurs',
        link: '/parametres/fournisseurs',
      },
      {
        label: 'Type d\'intervention',
        link: '/parametres/types-intervention',
      },
      {
        label: 'Listes des rôles',
        link: '/parametres/roles'
      },
    ]
  }
];
