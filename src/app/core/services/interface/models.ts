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

export interface CouponTicket {
  id: number;
  libelle: string;
  valeur: number;
  created_at: string;
  updated_at: string;
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
  date_mouvement: string;
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
