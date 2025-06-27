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
        fonctionnalites: ['Voir les entrées']
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
    fonctionnalites: ['Voir les immobilisations']
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
    fonctionnalites: ['Intervention Immobilisation', 'Ajout intervention']
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
    fonctionnalites: ['Ajout parc']
  },
  {
    label: 'Intervention Véhicules',
    icon: 'pen-tool',
    link: '/interventionvehicules',
    module: 'Gestion de parc',
    fonctionnalites: ['Intervention Parc']
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
    fonctionnalites: ['Ajout Parametrage', 'Modification Parametrage', 'Suppression Parametrage', 'Voir utilisateur'/* ,'Ajout utilisateur', 'Modification utilisateur', 'Suppression utilisateur', 'Exporter utilisateur' */]
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
        fonctionnalites: ['Ajout Parametrage', 'Ajout role']
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
        link: '/parametres/entreprise',
        fonctionnalites: ['Voir Parametres Généraux']
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
