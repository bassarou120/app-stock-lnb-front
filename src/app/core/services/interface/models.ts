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
export interface Exercice {
  id: number;
  date_debut: string;
  date_fin: string;
  annee: number;
  statut: string;
  created_at: string;
  updated_at: string;
}
export interface RetourTicket {
  id: number;
  mouvementTicket_id: number;
  mouvementTicket? : MouvementTicket;
  coupon_ticket_id: number;
  coupon_ticket? : CouponTicket;
  compagnie_petrolier_id: number;
  compagnie_petrolier? : CompagniePetroliere;
  qte: number;
  created_at: string;
  updated_at: string;
}

export interface AnnulationTicket {
  id: number;
  mouvementTicket_id: number;
  mouvementTicket? : MouvementTicket;
  coupon_ticket_id: number;
  coupon_ticket? : CouponTicket;
  compagnie_petrolier_id: number;
  compagnie_petrolier? : CompagniePetroliere;
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
    qte_actuel: number;
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
export interface UniteDeMesure {
  id: number;
  libelle: string;
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
  created_at: string| null;
  has_expiration_date?: boolean;
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
  cat?: Categorie;
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
  libelle?: string;
  marque_id?: number;
  marque?: Marque; // Relation chargée
  modele_id?: number;
  modele?: Modele; // Relation chargée
  annee?: number;
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
  id_fournisseur?: number;
  fournisseur?: Fournisseur; // Relation Fournisseur chargée
  description: string;
  id_type_mouvement: number;
  type_mouvement?: TypeMouvement; // Relation TypeMouvement chargée
  numero_borderau?: string;
  qte: number;
  qteDemande: number;
  date_mouvement: string;
  created_at: string;
  updated_at: string;
  statut?: string;
  unite_de_mesure:number;
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
  vehicule? : Vehicule;
  compagnie_petrolier_id: number;
  compagnie_petrolier? : CompagniePetroliere;
  coupon_ticket_id: number;
  coupon_ticket? : CouponTicket;
  employe_id: number;
  employe? : Employe;
  // CORRECTION MAJEURE : Ces propriétés doivent être des objets Commune, pas des nombres
  commune_depart_id: number; // Gardez l'ID si nécessaire pour l'envoi au backend
  depart?: Commune; // L'objet Commune lié pour la recherche et l'affichage

  commune_arriver_id: number; // Gardez l'ID si nécessaire pour l'envoi au backend
  arriver?: Commune; // L'objet Commune lié pour la recherche et l'affichage
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
  immo?: Immobilisation;
  type_intervention_id: number;
  type_intervention?: TypeIntervention;
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
  vehicule?: Vehicule;
  date_intervention: string;
  titre: string;
  montant: number;
  observation: string;
  created_at: string;
  updated_at: string;
  commune_depart_id: number;
  commune_arrivee_id: number;
  jours_restants: number;
  type_intervention_id: number;
  typeIntervention?: TypeIntervention;
  date_expiration?: string;
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
  id?: number;
  immo_id: number;
  immobilisation?: Immobilisation; // Relation Immobilisation
  old_bureau_id?: number;
  old_bureau?: Bureau; // Relation Ancien Bureau
  bureau_id: number;
  bureau?: Bureau; // Relation Nouveau Bureau
  old_employe_id?: number;
  old_employe?: Employe; // Relation Ancien Employe
  employe_id: number;
  employe?: Employe; // Relation Nouveau Employe
  date_mouvement: string;
  observation?: string;
  motif?: string; // Ajouté si présent dans ta BDD pour les transferts
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
  code: string;
  designation: string;
  montant_ttc: number;
  observation?: string;
  date_acquisition: string; // format YYYY-MM-DD
  date_mise_en_service?: string; // format YYYY-MM-DD

  // Clés étrangères (ID) - souvent présentes pour les relations Many-to-One
  id_groupe_type_immo: number;
  id_sous_type_immo: number;
  id_status_immo: number;
  employe_id?: number;
  bureau_id?: number;
  fournisseur_id?: number;
  vehicule_id?: number;

  // Relations (objets imbriqués) - Ces propriétés doivent correspondre aux noms
  // que Laravel utilise lors de l'eager loading (via `with()`)
  employe?: Employe;
  statusImmo?: StatusImmo;
  groupeTypeImmo?: GroupeTypeImmo;
  sousTypeImmo?: SousTypeImmo;
  bureau?: Bureau;
  fournisseur?: Fournisseur;
  vehicule?: Vehicule;
  reference_estampillonnage: string;

  // Ajoutez ici d'autres propriétés de l'immobilisation si nécessaire
  // ...
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
  article_stock_alerte_sans_rupture: number;
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
  id?: number; // ID de l'entrée de stock
  Qte_actuel: number; // Quantité actuelle de l'article en stock
  CMP: number;
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
}

export interface BackendPostResource<T> { // Exporté pour être utilisé dans le composant
  success: boolean;
  message: string;
  data: T; // Le type de 'data' dépend du contenu
}

export interface AppSetting {
  id?: number; // L'ID de la ligne dans la table de base de données Laravel (optionnel, mais utile)
  key: string; // La clé unique du paramètre (ex: 'company_name', 'primary_color', 'logo_url')
  value: string; // La valeur du paramètre (URL, code hex, Base64, etc.)
  type?: 'text' | 'color' | 'image_url' | 'base64_image' | 'number'; // Ajout de 'base64_image'
  description?: string; // Une description pour l'interface d'administration
}

export type AppSettingsMap = Map<string, AppSetting>;

export interface Exercice {
  id: number;
  date_debut: string;
  date_fin: string;
  annee: number;
  statut: string;
  created_at: string;
  updated_at: string;
}

export interface ExerciceResponse {
  success: boolean;
  exercice: Exercice;
}
