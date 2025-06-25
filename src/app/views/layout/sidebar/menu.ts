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
  // {
  //   label: 'Articles',
  //   icon: 'monitor',
  //   link: '/articles'
  // },
  // {
  //   label: 'Catégories',
  //   icon: 'box',
  //   link: '/categories'
  // },
  {
    label: 'Mouvement Stock',
    icon: 'maximize-2',
    module: 'Gestion de Stock',
    subItems: [
      {
        label: 'Entrées de Stock',
        link: '/mouvement-stock/entrees',
      }
      ,
      // {
      //   label: 'Demande de sortie',
      //   link: '/mouvement-stock/demande',
      // },
      {
        label: 'Les demandes',
        link: '/mouvement-stock/les-demandes',
      },
      {
        label: 'Sorties de Stock',
        link: '/mouvement-stock/sorties',
      }
    ]
  },
  {
    label: 'Etat de Stock',
    icon: 'bar-chart-2',
    link: '/etat-de-stock',
    module: 'Gestion de Stock',
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
  },
  {
    label: 'Affectations/Transfert',
    icon: 'send',
    link: '/transfert',
    module: 'Gestion de immobilisation',
  },
  {
    label: 'Intervention',
    icon: 'activity',
    link: '/intervention',
    module: 'Gestion de immobilisation',
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
  },
  {
    label: 'Intervention Véhicules',
    icon: 'pen-tool',
    link: '/interventionvehicules',
    module: 'Gestion de parc',
  },
  {
    label: 'Tickets',
    icon: 'credit-card',
    module: 'Gestion de parc',
    subItems: [
      {
        label: 'Attribution de Ticket',
        link: 'tickets/attribution',
      },
      {
        label: 'Entrée de Ticket',
        link: 'tickets/entree',
      },
      {
        label: 'Stock Ticket',
        link: 'tickets/',
      },


      {
        label: 'Retour Tickets',
        link: 'tickets/retour-ticket',
      },

      {
        label: 'Annulation de Tickets',
        link: 'tickets/annulation-ticket',
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
      },
      {
        label: 'Permissions',
        link: '/parametres/permissions',
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

  },
  {
    label: 'Rapport Immo',
    icon: 'file',
    link: '/rapports/immo',
    module: 'Gestion Rapport',
  },
  {
    label: 'Rapport parc',
    icon: 'file',
    link: '/rapports/parc',
    module: 'Gestion Rapport',
  },
  {
    label: 'Rapport ticket',
    icon: 'file',
    link: '/rapports/ticket',
    module: 'Gestion Rapport',
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
