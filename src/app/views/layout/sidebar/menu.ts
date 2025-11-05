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
    label: 'Gestion des Stocks',
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
        fonctionnalites: ['Voir les entrées']
      },
      {
        label: 'Les demandes de fourn...',
        link: '/mouvement-stock/les-demandes',
        fonctionnalites: ['Voir Les demandes']
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
    fonctionnalites: ['Voir Etat de Stock']
  },
  {
    label: 'Gestion des Immobilisations',
    isTitle: true,
    module: 'Gestion de immobilisation',

  },
  {
    label: 'Enrégistrement',
    icon: 'download',
    link: '/enregistrement-immos',
    module: 'Gestion de immobilisation',
    fonctionnalites: ['Voir les immobilisations']
  },
  {
    label: 'Affectations/Transfert',
    icon: 'send',
    link: '/transfert',
    module: 'Gestion de immobilisation',
    fonctionnalites: ['Voir les Transferts']
  },
  {
    label: 'Intervention',
    icon: 'activity',
    link: '/intervention',
    module: 'Gestion de immobilisation',
    fonctionnalites: ['Voir les Interventions Immo']
  },
  {
    label: 'Gestion du Parc-Auto',
    isTitle: true,
    module: 'Gestion de parc',
  },
  {
    label: 'Véhicules',
    icon: 'truck',
    link: '/vehicules',
    module: 'Gestion de parc',
    fonctionnalites: ['Voir parc vehicule']
  },
  {
    label: 'Intervention Véhicules',
    icon: 'pen-tool',
    link: '/interventionvehicules',
    module: 'Gestion de parc',
    fonctionnalites: ['Voir intervention vehicule']
  },
  {
    label: 'Ticket Valeur',
    icon: 'credit-card',
    module: 'Gestion de parc',
    subItems: [
      {
        label: 'Entrée de Ticket Valeur',
        link: 'tickets/entree',
        fonctionnalites: ['Voir entrée de ticket']
      },
      {
        label: 'Attribution de Ticket Valeur',
        link: 'tickets/attribution',
        fonctionnalites: ['Attribution ticket']
      },
      {
        label: 'Stock Ticket Valeur',
        link: 'tickets/',
        fonctionnalites: ['Verifier Stock Ticket']
      },
      {
        label: 'Retour Tickets Valeur',
        link: 'tickets/retour-ticket',
        fonctionnalites: ['Voir Retour Ticket']
      },

      {
        label: 'Annulation de Tickets Valeur',
        link: 'tickets/annulation-ticket',
        fonctionnalites: ['Voir Annulation Ticket']
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
    fonctionnalites: ['Voir utilisateur']
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
        fonctionnalites: ['Voir role']
      },
      {
        label: 'Permissions',
        link: '/parametres/permissions',
        fonctionnalites: ['Voir permissions']
      },
    ]
  },
  //
  {
    label: 'Sorties Patrimoine',
    isTitle: true,
    module: 'Gestion Rapport',
  },
  {
    label: 'Sortie De Patrimoine',
    icon: 'file',
    link: '/sortie-patrimoines',
    module: 'Gestion Rapport',
  },
  //
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
    fonctionnalites: ['Rapport Immo']
  },
  {
    label: 'Rapport parc',
    icon: 'file',
    link: '/rapports/parc',
    module: 'Gestion Rapport',
    fonctionnalites: ['Rapport Parc']
  },
  {
    label: 'Rapport ticket',
    icon: 'file',
    link: '/rapports/ticket',
    module: 'Gestion Rapport',
    fonctionnalites: ['Rapport Ticket']
  },
  {
    label: 'Paramètres',
    isTitle: true,
     module: 'Parametrage',
  },
  {
    label: 'Paramètres Exercice',
    icon: 'box',
    module: 'Parametrage',
    subItems: [
      {
        label: 'Exercice',
        link: '/mouvement-stock/exercice',
        fonctionnalites: ['Sorties de Stock'],
      }
      ,
      {
        label: 'Articles exercices',
        link: '/mouvement-stock/articles-exercices',
        fonctionnalites: ['Sorties de Stock'],
      }
    ]
  },
  {
    label: 'Paramètres Stock',
    icon: 'box',
    module: 'Parametrage',
    subItems: [
      {
        label: 'Articles',
        link: '/parametres-stock/articles',
        fonctionnalites: ['Voir Parametres Stock']
      },
      {
        label: 'Catégories',
        link: '/parametres-stock/categories',
        fonctionnalites: ['Voir Parametres Stock']
      },
      {
        label: 'Liste des Bureaux/Localisations',
        link: '/parametres-stock/bureaux',
        fonctionnalites: ['Voir Parametres Stock']
      },
      {
        label: 'Liste des Magazins',
        link: '/parametres-stock/magazins',
        fonctionnalites: ['Voir Parametres Stock']
      },
      {
        label: 'Type d\'Affectation',
        link: '/parametres-stock/type-affectation',
        fonctionnalites: ['Voir Parametres Stock']
      },
      {
        label: 'Unité de mesure',
        link: '/parametres-stock/unite-de-mesure',
        fonctionnalites: ['Voir Parametres Stock']
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
        fonctionnalites: ['Voir Parametres Parc']
      },
      {
        label: 'Communes',
        link: '/parametres-pack/communes',
        fonctionnalites: ['Voir Parametres Parc']
      },
      {
        label: 'Coupon Ticket',
        link: '/parametres-pack/coupon-ticket',
        fonctionnalites: ['Voir Parametres Parc']
      },
      {
        label: 'Catégorie Sortie Ticket',
        link: '/parametres-pack/categorie-sortie-ticket',
        fonctionnalites: ['Voir Parametres Parc']
      },
      {
        label: 'Compagnie Pétrolière',
        link: '/parametres-pack/compagnie-petroliere',
        fonctionnalites: ['Voir Parametres Parc']
      },
      {
        label: 'Trajet',
        icon: 'git-pull-request',
        link: '/parametres-pack/trajets',
        fonctionnalites: ['Voir Parametres Parc']
      },
      {
        label: 'Exercice - Ticket Valeur',
        link: '/parametres-pack/exercice-mouvementticket',
        fonctionnalites: ['Voir Parametres Parc']
      },
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
        fonctionnalites: ['Voir Parametres Immo']
      },
      {
        label: 'Sous Type Immo',
        link: '/parametres-immo/sous-type-immo',
        fonctionnalites: ['Voir Parametres Immo']
      },
      {
        label: 'Groupe Type Immo',
        link: '/parametres-immo/groupe-type-immo',
        fonctionnalites: ['Voir Parametres Immo']
      },
      {
        label: 'Status Immo',
        link: '/parametres-immo/status-immo',
        fonctionnalites: ['Voir Parametres Immo']
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
        link: '/site-settings', // Le lien vers la nouvelle route
        module: 'Parametrage',
      },
      {
        label: 'Type Mouvement',
        link: '/parametres/type-mouvement',
        fonctionnalites: ['Voir Parametres Généraux']
      },
      {
        label: 'Liste du Personnel',
        link: '/parametres/employes',
        fonctionnalites: ['Voir Parametres Généraux']
      },
      {
        label: 'Liste des Fournisseurs',
        link: '/parametres/fournisseurs',
        fonctionnalites: ['Voir Parametres Généraux']
      },
      {
        label: 'Type d\'intervention',
        link: '/parametres/types-intervention',
        fonctionnalites: ['Voir Parametres Généraux']
      },
/*       {
        label: 'Listes des rôles',
        link: '/parametres/roles',
        fonctionnalites: ['Voir Parametres Généraux']
      }, */
    ]
  }
];
