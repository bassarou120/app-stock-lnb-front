export interface apiResultFormat {
  data: Array<any>;
  totalData: number;
}

export interface Commune {
  id: number;
  libelle_commune: string;
  created_at: string;
  updated_at: string;
}
export interface RetourTicket {
  id: number;
  mouvementTicket_id: number;
  coupon_ticket_id: number;
  compagnie_petrolier_id: number;
  qte: number;
  created_at: string;
  updated_at: string;
}

export interface AnnulationTicket {
  id: number;
  mouvementTicket_id: number;
  coupon_ticket_id: number;
  compagnie_petrolier_id: number;
  qte: number;
  created_at: string;
  updated_at: string;
}

export interface CouponTicket {
  id: number;
  libelle: string;
  valeur: number;
  created_at: string;
  updated_at: string;
}

export interface StockTicket {
  id: number;
  coupon_ticket_id: number;
  compagnie_petrolier_id: number;
  qte_actuel: number;
  created_at: string;
  updated_at: string;

  coupon_ticket?: {
    id: number;
    libelle: string;
    valeur: number;
  };

  compagnie?: {
    id: number;
    libelle: string;
    adresse: string;
  };
}

export interface Marque {
  id: number;
  libelle: string;
  created_at: string;
  updated_at: string;
}

export interface Modele {
  id: number;
  libelle_modele: string;
  created_at: string;
  updated_at: string;
}
export interface StatusImmo {
  id: number;
  libelle_status_immo: string;
  created_at: string;
  updated_at: string;
}
export interface Bureau {
  id: number;
  libelle_bureau: string;
  valeur: number;
  created_at: string;
  updated_at: string;
}
export interface Magazin {
  id: number;
  libelle_magazin: string;
  localisation: string;
  created_at: string;
  updated_at: string;
}
export interface TypeImmo {
  id: number;
  libelle_typeImmo: string;
  compte: number;
  created_at: string;
  updated_at: string;
}
export interface SousTypeImmo {
  id: number;
  id_type_immo: number;
  libelle: string;
  compte: number;
  created_at: string;
  updated_at: string;
}
export interface GroupeTypeImmo {
  id: number;
  id_sous_type_immo: number;
  libelle: string;
  compte: number;
  created_at: string;
  updated_at: string;
}

export interface TypeAffectation {
  id: number;
  libelle_type_affectation: string;
  valeur: number;
  created_at: string;
  updated_at: string;
}

export interface CompagniePetroliere {
  id: number;
  libelle: string;
  adresse: string;
  created_at: string;
  updated_at: string;
}
export interface Fournisseur {
  id: number;
  nom: string;
  telephone: string;
  adresse: string;
  created_at: string;
  updated_at: string;
}
export interface Employe {
  id: number;
  nom: string;
  telephone: string;
  email: string;
  created_at: string;
  updated_at: string;
}
export interface TypeIntervention {
  id: number;
  libelle_type_intervention: string;
  applicable_seul_vehicule: boolean;
  observation: string;
  date_expiration: string;
  created_at: string;
  updated_at: string;
}
export interface TypeMouvement {
  id: number;
  libelle_type_mouvement: string;
  valeur: string;
  created_at: string;
  updated_at: string;
}
export interface Categorie {
  id: number;
  libelle_categorie_article: string;
  valeur: string;
  taux: number;
  created_at: string;
  updated_at: string;
}

export interface Article {
  id: number;
  id_cat: number;
  libelle: string;
  description: number;
  created_at: string;
  updated_at: string;
  seuil_alerte: number;
  stock?: ArticleStockInfo;
  code_article?: string;
}

export interface Vehicule {
  id: number;
  marque_id: number;
  modele_id: number;
  immatriculation: string;
  numero_chassis: string;
  kilometrage: number;
  date_mise_en_service: string;
  created_at: string;
  updated_at: string;
}

export interface MouvementStock {
  id: number;
  id_Article: number;
  id_fournisseur: number;
  description: string;
  id_type_mouvement: number;
  qte: number;
  qteDemande: number;
  date_mouvement: string;
  created_at: string;
  updated_at: string;
  statut?: string;
  piece_jointe_mouvement?: string;

  // Champs supplémentaires fournis par l’API
  code_mouvement?: string;
  dateDemande?: string;
  article?: {
    libelle: string;
    code_article: string;
  };
  bureau?: {
    libelle_bureau: string;
  };
  employe?: {
    fullnameEmploye: string;
  };
}

export interface MouvementStockGrouped {
  code_mouvement: string;
  personnel: string;
  bureau: string;
  dateDemande: string;
  dateCreation: string;
  statut: string;
  totalArticles: number;
  details: MouvementStock[];
}


export interface MouvementTicket {
  id: number;
  vehicule_id: number;
  compagnie_petrolier_id: number;
  coupon_ticket_id: number;
  employe_id: number;
  commune_depart: number;
  commune_arriver: number;
  description: string;
  objet: string;
  id_type_mouvement: number;
  kilometrage: number;
  qte: number;
  date: string;
  reference: string;
  created_at: string;
  updated_at: string;
}

export interface Intervention {
  id: number;
  immo_id: number;
  type_intervention_id: number;
  date_intervention: string;
  titre: string;
  cout: number;
  observation: string;
  created_at: string;
  updated_at: string;
}

export interface InterventionVehicule {
  id: number;
  vehicule_id: number;
  date_intervention: string;
  titre: string;
  montant: number;
  observation: string;
  created_at: string;
  updated_at: string;
  commune_depart_id: number;
  commune_arrivee_id: number;
}

export interface Utilisateur {
  id: string; // Ou number si tes IDs sont numériques
  name: string;
  surname: string;
  email: string;
  phone: string;
  sexe: 'Masculin' | 'Féminin';
  active: boolean;
  photo?: string; 
  role_id: number; 
  role?: Role;
  employe_id?: number; 
  employe?: Employe; 
  last_activity?: Date;
  created_at?: Date;
  updated_at?: Date;
}


export interface Transfert {
  id: number;
  immo_id: number;
  old_bureau_id: number;
  old_employe_id: number;
  bureau_id: number;
  employe_id: number;
  date_mouvement: string;
  observation: string;
  created_at: string;
  updated_at: string;
}

export interface Trajet{
  id: number;
  valeur: number;
  commune_depart: number;
  commune_arriver: number;
  trajet_aller_retour: boolean;
  observation: string | null; // Peut être nul
  created_at: string;
  updated_at: string;
}

export interface Immobilisation {
  id: number;
  bureau_id: number;
  employe_id: number;
  date_mouvement: string;
  fournisseur_id: number;
  designation: string;
  isVehicule: boolean;
  vehicule_id: number;
  code: string;
  id_groupe_type_immo: number;
  id_sous_type_immo: number;
  duree_amorti: number;
  etat: string;
  taux_ammortissement: number;
  duree_ammortissement: number;
  date_acquisition: string;
  date_mise_en_service: string;
  observation: string;
  id_status_immo: number;
  montant_ttc: number;
  created_at: string;
  updated_at: string;
}

export interface   Role {
  id: number;
  libelle_role: string;
}

export interface User {
  id: string;
  name: string;
  surname?: string;
  photo?: string;
  sexe: string;
  last_activity: string;
  active: boolean;
  email: string;
  phone: string;
  role_id: number;
  role: Role;
}

export interface LoginResponse {
  token: string;
  user: User;
  perm: any[]; 
}

export interface DashboardData {
  total_article_en_alerte: number;
  total_article: number;
  total_demandes_en_attente: number;
  total_demandes_accorde: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}


export interface PaginatedResponse<T> {
  current_page: number;
  data: T[]; 
  first_page_url: string;
  from: number;
  last_page: number;
  last_page_url: string;
  links: any[]; 
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number;
  total: number;
}

export interface ArticleStockInfo {
<<<<<<< HEAD
  id?: number; 
  Qte_actuel: number;

=======
  id?: number; // ID de l'entrée de stock
  Qte_actuel: number; // Quantité actuelle de l'article en stock
  // Ajoute ici d'autres propriétés si ton objet 'stock' de l'API en contient
  // Exemple: id_article?: number;
}


export interface Permission {
  id: number;
  role_id: number;
  module_id: number;
  fonctionnalite_id: number;
  is_active: boolean;
  role: {
    id: number;
    libelle_role: string;
  };
  module: {
    id: number;
    libelle_module: string;
  };
  fonctionnalite: {
    id: number;
    libelle_fonctionnalite: string;
  };
>>>>>>> philemon_dev
}
