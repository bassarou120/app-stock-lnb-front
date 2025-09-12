// src/app/views/pages/rapports/stock/rapport-stock.component.ts
import { Component, ViewChild, OnInit, OnDestroy, inject } from '@angular/core';
import { FormGroup, FormBuilder, Validators, AbstractControl, ValidatorFn } from '@angular/forms';
import { ColumnMode, DatatableComponent, NgxDatatableModule } from '@siemens/ngx-datatable';
import { NgbDateStruct, NgbCalendar, NgbDatepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { CommonModule, DatePipe } from '@angular/common';
import { NgSelectModule } from '@ng-select/ng-select';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { NgbAlertModule, NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { FeatherIconDirective } from '../../../../core/feather-icon/feather-icon.directive';

// Services
import { StockRapportService } from '../../../../core/services/rapport/stock/stock-rapport.service';
import { BackendPostResource } from '../../../../core/services/interface/models';
import { ArticleService } from '../../../../core/services/articles/articles.service';
import { FournisseursService } from '../../../../core/services/fournisseurs/fournisseurs.service';
import { TypeMouvementService } from '../../../../core/services/types-mouvement/types-mouvement.service';
import { EmployesService } from '../../../../core/services/employes/employes.service';
import { BureauxService } from './../../../../core/services/bureaux/bureaux.service';

// Interfaces
import {
  MouvementStock, Article, Fournisseur, TypeMouvement, Employe, PaginatedResponse, Bureau
} from '../../../../core/services/interface/models';

import { Observable, Subject, takeUntil } from 'rxjs';

// NOUVELLE INTERFACE : Pour le rapport d'état de stock
export interface RapportEtatStockArticle {
  article: {
    id: number;
    libelle: string;
    code_article: string;
    description: string;
    categorie: string;
    stock_alerte: number;
    unite_de_mesure?: string;
  };
  stock_actuel: {
    quantite: number;
    prix_unitaire: number;
    montant_total: number;
    date_maj?: string | Date | null;
  };
  derniere_entree?: {
    date: string | Date | null;
    quantite: number;
    prix_unitaire: number;
    montant: number;
    fournisseur: string;
    description: string;
    type_mouvement: string;
    dans_periode: boolean;
  };
  derniere_sortie?: {
    date: string | Date | null;
    quantite: number;
    prix_unitaire: number;
    montant: number;
    employe: string;
    bureau: string;
    description: string;
    type_mouvement: string;
    statut: string;
    dans_periode: boolean;
  };
  synthese_periode: {
    total_entrees: number;
    total_sorties: number;
    mouvement_net: number;
    periode: string;
  };
  debug?: any;
}

// Définir les types de rapport pour les stocks
interface TypeRapportStock {
  id: string;
  libelle: string;
}

@Component({
  selector: 'app-rapport-stock',
  standalone: true,
  imports: [
    CommonModule,
    NgSelectModule,
    ReactiveFormsModule,
    FormsModule,
    NgbAlertModule,
    NgbDropdownModule,
    NgbDatepickerModule,
    FeatherIconDirective,
    NgxDatatableModule,
    DatePipe,
  ],
  templateUrl: './rapport-stock.component.html',
  styleUrls: []
})
export class RapportStockComponent implements OnInit, OnDestroy {
  @ViewChild('table') table!: DatatableComponent;

  rapportForm!: FormGroup;
  rows: any[] = [];
  temp: any[] = [];
  loadingIndicator = false;
  ColumnMode = ColumnMode;

  // Listes pour les dropdowns de filtrage
  articles: Article[] = [];
  fournisseurs: Fournisseur[] = [];
  typeMouvements: TypeMouvement[] = [];
  employes: Employe[] = [];
  bureaux: Bureau[] = [];

  // Types de rapports de stock
  typeRapportsStock: TypeRapportStock[] = [
    { id: 'entree', libelle: 'Ordre d\'Entrée' },
    { id: 'sortie', libelle: 'Ordre de Sortie' },
    { id: 'etat_stock', libelle: 'État de Stock' },
    { id: 'individuel', libelle: 'Rapport Individuel' },
  ];
  selectedReportTypeId: string | null = null;

  // Indicateurs pour l'affichage conditionnel des filtres
  showEntryFilters: boolean = false;
  showExitFilters: boolean = false;
  showStockStatusFilters: boolean = false;
  showIndividuelFilters: boolean = false;

  errorMessage: string = '';
  isGeneratingReport = false;
  currentDate: NgbDateStruct = inject(NgbCalendar).getToday();
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private stockRapportService: StockRapportService,
    private articlesService: ArticleService,
    private fournisseursService: FournisseursService,
    private typeMouvementService: TypeMouvementService,
    private employesService: EmployesService,
    private bureauxService: BureauxService,
    private ngbCalendar: NgbCalendar // <-- INJECTION DE NgbCalendar
  ) { }

  ngOnInit(): void {
    console.log('ngOnInit: Démarrage du chargement des données...');
    this.initForm();
    this.loadFilterData();
    this.rapportForm.get('id_type_rapport')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(typeRapportId => {
      this.onTypeRapportChange(typeRapportId);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Validateur de plage de dates (utilisé pour entrée et sortie et état de stock)
  dateRangeValidatorForReport(): ValidatorFn {
    return (group: AbstractControl): { [key: string]: any } | null => {
      const formGroup = group as FormGroup;
      const startDateControl = formGroup.get('date_debut');
      const endDateControl = formGroup.get('date_fin');

      const startDate = startDateControl?.value as NgbDateStruct;
      const endDate = endDateControl?.value as NgbDateStruct;

      if (startDateControl?.hasValidator(Validators.required) && endDateControl?.hasValidator(Validators.required)) {
        if (!startDate && endDate) {
          return { 'dateRangeMissingStartDate': true };
        }
        if (startDate && !endDate) {
          return { 'dateRangeMissingEndDate': true };
        }
      }

      if (startDate && endDate) {
        const sDate = new Date(startDate.year, startDate.month - 1, startDate.day);
        const eDate = new Date(endDate.year, endDate.month - 1, endDate.day);

        if (sDate > eDate) {
          return { 'dateRangeInvalidOrder': true };
        }
      }
      return null;
    };
  }

  initForm(): void {
    // <-- DÉBUT DES MODIFICATIONS POUR LES DATES PAR DÉFAUT
    const today = this.ngbCalendar.getToday();
    const firstDayOfMonth: NgbDateStruct = { year: today.year, month: today.month, day: 1 };
    // <-- FIN DES MODIFICATIONS POUR LES DATES PAR DÉFAUT

    this.rapportForm = this.fb.group({
      id_type_rapport: [null, Validators.required],

      // Champs communs aux rapports (dates)
      date_debut: [firstDayOfMonth, Validators.required], // <-- Date par défaut et Validation
      date_fin: [today, Validators.required],             // <-- Date par défaut et Validation

      // Champs spécifiques au rapport d'entrée
      id_Article_entree: [{ value: null, disabled: true }],
      id_fournisseur_entree: [{ value: null, disabled: true }],

      // Champs spécifiques au rapport de sortie
      id_Article_sortie: [{ value: null, disabled: true }],
      id_employe_sortie: [{ value: null, disabled: true }],

      // NOUVEAUX Champs spécifiques au rapport d'état de stock
      id_Article_etat: [{ value: null, disabled: true }],
      qte_min_etat: [{ value: null, disabled: true }],
      qte_max_etat: [{ value: null, disabled: true }],
    });
    // Appliquer le validateur de plage de dates au formulaire dès l'initialisation
    this.rapportForm.setValidators(this.dateRangeValidatorForReport());
    this.rapportForm.updateValueAndValidity();
    console.log('RapportStockComponent: Form initialized with default dates and initial validators.');
  }

  onTypeRapportChange(typeRapportId: string | null): void {
    this.selectedReportTypeId = typeRapportId;
    this.resetFormControls(); // Réinitialise et désactive tous les contrôles, y compris les dates.

    // <-- DÉBUT DES MODIFICATIONS POUR LES DATES PAR DÉFAUT (RÉAPPLICATION)
    const today = this.ngbCalendar.getToday();
    const firstDayOfMonth: NgbDateStruct = { year: today.year, month: today.month, day: 1 };
    // <-- FIN DES MODIFICATIONS POUR LES DATES PAR DÉFAUT

    // Réactiver et appliquer les dates par défaut aux champs de date globaux
    this.rapportForm.get('date_debut')?.setValue(firstDayOfMonth); // <-- Réapplication de la date par défaut
    this.rapportForm.get('date_fin')?.setValue(today);             // <-- Réapplication de la date par défaut
    this.rapportForm.get('date_debut')?.enable();
    this.rapportForm.get('date_fin')?.enable();
    this.rapportForm.get('date_debut')?.setValidators(Validators.required);
    this.rapportForm.get('date_fin')?.setValidators(Validators.required);
    this.rapportForm.setValidators(this.dateRangeValidatorForReport()); // Réapplique le validateur de groupe

    switch (typeRapportId) {
      case 'entree':
        this.showEntryFilters = true;
        this.showExitFilters = false;
        this.showStockStatusFilters = false;
        this.showIndividuelFilters = false;
        this.rapportForm.get('id_Article_entree')?.enable();
        this.rapportForm.get('id_fournisseur_entree')?.enable();
        console.log('onTypeRapportChange: Showing entry filters.');
        break;

      case 'sortie':
        this.showEntryFilters = false;
        this.showExitFilters = true;
        this.showStockStatusFilters = false;
        this.showIndividuelFilters = false;
        this.rapportForm.get('id_Article_sortie')?.enable();
        this.rapportForm.get('id_employe_sortie')?.enable();
        console.log('onTypeRapportChange: Showing exit filters.');
        break;

      case 'etat_stock':
        this.showEntryFilters = false;
        this.showExitFilters = false;
        this.showStockStatusFilters = true;
        this.showIndividuelFilters = false;
        this.rapportForm.get('id_Article_etat')?.enable();
        this.rapportForm.get('qte_min_etat')?.enable();
        this.rapportForm.get('qte_max_etat')?.enable();
        this.rapportForm.get('qte_min_etat')?.setValidators(Validators.min(0));
        this.rapportForm.get('qte_max_etat')?.setValidators(Validators.min(0));
        this.rapportForm.setValidators(this.quantityRangeValidator()); // Appliquer le validateur spécifique pour les quantités
        console.log('onTypeRapportChange: Showing stock status filters.');
        break;

      case 'individuel':
        this.showEntryFilters = false;
        this.showExitFilters = false;
        this.showStockStatusFilters = false;
        this.showIndividuelFilters = true;
        this.rapportForm.get('id_Article_entree')?.enable();
        this.rapportForm.get('id_fournisseur_entree')?.enable();
        console.log('onTypeRapportChange: Showing entry filters.');
        break;

      default:
        this.showEntryFilters = false;
        this.showExitFilters = false;
        this.showStockStatusFilters = false;
        this.showIndividuelFilters = false;
        // Désactiver et nettoyer les validateurs des dates si aucun type de rapport n'est sélectionné
        this.rapportForm.get('date_debut')?.disable();
        this.rapportForm.get('date_fin')?.disable();
        this.rapportForm.get('date_debut')?.clearValidators();
        this.rapportForm.get('date_fin')?.clearValidators();
        this.rapportForm.clearValidators(); // Effacer aussi les validateurs de groupe
        this.rapportForm.reset({ id_type_rapport: typeRapportId }); // Réinitialise et garde le type sélectionné
        this.markFormGroupTouched(this.rapportForm);
        console.log('onTypeRapportChange: No specific report type selected or unknown.');
        break;
    }
    this.rapportForm.updateValueAndValidity();
    this.errorMessage = '';
    this.rows = [];
    this.temp = [];
    console.log('onTypeRapportChange: Form updated and errors/rows cleared.');
  }

  // NOUVEAU VALIDATEUR : Pour les plages de quantités (qte_min_etat <= qte_max_etat)
  quantityRangeValidator(): ValidatorFn {
    return (group: AbstractControl): { [key: string]: any } | null => {
      const formGroup = group as FormGroup;
      const qteMinControl = formGroup.get('qte_min_etat');
      const qteMaxControl = formGroup.get('qte_max_etat');

      const qteMin = qteMinControl?.value;
      const qteMax = qteMaxControl?.value;

      if (typeof qteMin === 'number' && typeof qteMax === 'number' && qteMin > qteMax) {
        return { 'quantityRangeInvalidOrder': true };
      }
      return null;
    };
  }

  private resetFormControls(): void {
    Object.keys(this.rapportForm.controls).forEach(key => {
      const control = this.rapportForm.get(key);
      if (control && key !== 'id_type_rapport') {
        control.setValue(null);
        control.clearValidators();
        control.disable();
      }
    });
    this.showEntryFilters = false;
    this.showExitFilters = false;
    this.showStockStatusFilters = false;
    this.showIndividuelFilters = false;
    this.rapportForm.clearValidators(); // Clear group validators as well
    this.rapportForm.updateValueAndValidity();
    this.rows = [];
    this.temp = [];
    console.log('All non-type-rapport form controls reset and filters hidden.');
  }

  loadFilterData(): void {
    console.log('Loading filter data...');
    this.articlesService.getAllArticles().pipe(takeUntil(this.destroy$)).subscribe((data: Article[]) => { this.articles = data; console.log('Articles loaded:', data.length); });
    this.fournisseursService.getAllFournisseurs().pipe(takeUntil(this.destroy$)).subscribe((data: Fournisseur[]) => { this.fournisseurs = data; console.log('Fournisseurs loaded:', data.length); });
    this.typeMouvementService.getAllTypeMouvement().pipe(takeUntil(this.destroy$)).subscribe((data: TypeMouvement[]) => { this.typeMouvements = data; console.log('TypeMouvements loaded:', data.length); });
    this.employesService.getAllEmployes().pipe(takeUntil(this.destroy$)).subscribe((data: Employe[]) => { this.employes = data; console.log('Employes loaded:', data.length); });
    this.bureauxService.getAllBureaux().pipe(takeUntil(this.destroy$)).subscribe((data: Bureau[]) => { this.bureaux = data; console.log('Bureaux loaded:', data.length); });
  }

  // NOUVELLE FONCTION UTILITAIRE POUR PARSER LES DATES
  private parseBackendDateString(dateString: string | null | undefined): Date | null {
    if (!dateString || typeof dateString !== 'string' || dateString === '') {
      return null;
    }

    // Tenter de matcher le format "DD/MM/YYYY HH:mm" ou "DD/MM/YYYY HH:mm:ss"
    const match = dateString.match(/(\d{2})\/(\d{2})\/(\d{4})(?: (\d{2}):(\d{2})(?::(\d{2}))?)?/);
    if (match) {
      const year = parseInt(match[3], 10);
      const month = parseInt(match[2], 10) - 1; // Mois est 0-indexé
      const day = parseInt(match[1], 10);
      const hours = parseInt(match[4] || '0', 10);
      const minutes = parseInt(match[5] || '0', 10);
      const seconds = parseInt(match[6] || '0', 10);

      const date = new Date(year, month, day, hours, minutes, seconds);
      // Vérifier si la date est valide (Date.parse retourne NaN pour invalide)
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
    // Si la chaîne n'est pas au format attendu, tenter de la parser directement (par exemple si c'est déjà ISO)
    const fallbackDate = new Date(dateString);
    if (!isNaN(fallbackDate.getTime())) {
      return fallbackDate;
    }

    console.warn(`Impossible de parser la date: "${dateString}". Retourne null.`);
    return null;
  }

  loadRapportStock(): void {
    console.log('--- Tentative de chargement du rapport de stock ---');
    console.log('Form isValid before API call:', this.rapportForm.valid);
    console.log('Form errors (group level):', this.rapportForm.errors);
    Object.keys(this.rapportForm.controls).forEach(key => {
      if (this.rapportForm.get(key)?.errors && this.rapportForm.get(key)?.enabled) {
        console.log(`Errors on control ${key}:`, this.rapportForm.get(key)?.errors);
      }
    });

    if (this.rapportForm.invalid) {
      this.errorMessage = "Veuillez sélectionner un type de rapport et remplir tous les champs obligatoires correctement.";
      this.markFormGroupTouched(this.rapportForm);
      console.warn('Formulaire invalide, requête non envoyée.');
      return;
    }

    this.isGeneratingReport = true;
    this.loadingIndicator = true;
    this.errorMessage = '';
    this.rows = [];
    this.temp = [];

    const filters: { [key: string]: any } = { ...this.rapportForm.value };

    filters.date_debut = filters.date_debut ? this.formatDate(filters.date_debut) : null;
    filters.date_fin = filters.date_fin ? this.formatDate(filters.date_fin) : null;

    const finalFilters: { [key: string]: any } = {};

    if (this.selectedReportTypeId === 'entree') {
        finalFilters.id_type_rapport = 'entree';
        finalFilters.id_Article = filters.id_Article_entree;
        finalFilters.id_fournisseur = filters.id_fournisseur_entree;
        const typeEntree = this.typeMouvements.find(t => t.libelle_type_mouvement?.toLowerCase() === 'entrée de stock');
        if (typeEntree) {
            finalFilters.id_type_mouvement = typeEntree.id;
        } else {
            console.warn("Type de mouvement 'entrée de stock' non trouvé. Veuillez vérifier les données.");
        }
    } else if (this.selectedReportTypeId === 'sortie') {
        finalFilters.id_type_rapport = 'sortie';
        finalFilters.id_Article = filters.id_Article_sortie;
        finalFilters.id_employe = filters.id_employe_sortie;
        const typeSortie = this.typeMouvements.find(t => t.libelle_type_mouvement?.toLowerCase() === 'sortie de stock');
        if (typeSortie) {
            finalFilters.id_type_mouvement = typeSortie.id;
        } else {
            console.warn("Type de mouvement 'sortie de stock' non trouvé. Veuillez vérifier les données.");
        }
    } else if (this.selectedReportTypeId === 'etat_stock') {
        finalFilters.id_article = filters.id_Article_etat;
        finalFilters.qte_min = filters.qte_min_etat;
        finalFilters.qte_max = filters.qte_max_etat;

    }   else if (this.selectedReportTypeId === 'individuel') {
        finalFilters.id_type_rapport = 'individuel';
        finalFilters.id_Article = filters.id_Article_entree;
        finalFilters.id_fournisseur = filters.id_fournisseur_entree;
    }




    // Ajouter les dates aux filtres finaux, elles sont communes
    if (filters.date_debut) finalFilters.date_debut = filters.date_debut;
    if (filters.date_fin) finalFilters.date_fin = filters.date_fin;

    // Supprimer les champs null ou undefined des filtres finaux
    Object.keys(finalFilters).forEach(key => {
        if (finalFilters[key] === null || finalFilters[key] === undefined || finalFilters[key] === '') {
            delete finalFilters[key];
        }
    });

    console.log('Envoi des filtres AU BACKEND pour le rapport:', finalFilters);

    let apiCall: Observable<BackendPostResource<any>>;
    if (this.selectedReportTypeId === 'etat_stock') {
      apiCall = this.stockRapportService.getRapportEtatStockData(finalFilters);
    } else {
      apiCall = this.stockRapportService.getRapportData(finalFilters);
    }

apiCall.pipe(takeUntil(this.destroy$)).subscribe(
  (response: any) => {
    console.log('Réponse du backend (brute du service):', response);

    if (response.success && response.data) {
      if (this.selectedReportTypeId === 'etat_stock') {
        // Logique existante pour 'etat_stock'
        this.rows = (response.data.articles || []).map((item: any) => ({
          ...item,
          derniere_entree: item.derniere_entree ? { ...item.derniere_entree, date: this.parseBackendDateString(item.derniere_entree.date) } : null,
          derniere_sortie: item.derniere_sortie ? { ...item.derniere_sortie, date: this.parseBackendDateString(item.derniere_sortie.date) } : null,
          stock_actuel: item.stock_actuel ? { ...item.stock_actuel, date_maj: this.parseBackendDateString(item.stock_actuel.date_maj) } : null,
        }));
        this.temp = [...this.rows];
        console.log('Données du rapport d\'état de stock chargées:', this.rows);
      } else if (this.selectedReportTypeId === 'entree' || this.selectedReportTypeId === 'sortie') {
        // Logique existante pour 'entree' et 'sortie'
        this.rows = (response.data.data || []).map((item: any) => ({
          ...item,
          date_mouvement: this.parseBackendDateString(item.date_mouvement)
        }));
        this.temp = [...this.rows];
        console.log('Données du rapport entrée/sortie chargées:', this.rows);
      } else if (this.selectedReportTypeId === 'individuel') {
        // Nouvelle logique pour le rapport 'individuel'
        // Le tableau de données est directement sous la clé 'data'
        this.rows = (response.data || []).map((item: any) => ({
          ...item,
          date_mouvement: this.parseBackendDateString(item.date_mouvement)
        }));
        this.temp = [...this.rows];
        console.log('Données du rapport individuel chargées:', this.rows);
      } else {
        // Cas par défaut si le type de rapport n'est pas géré
        this.rows = [];
        this.temp = [];
        this.errorMessage = "Type de rapport non géré ou aucune donnée trouvée.";
      }
    } else {
      this.rows = [];
      this.temp = [];
      this.errorMessage = response.message || "Aucune donnée trouvée ou erreur inattendue.";
    }

        // Le reste de votre code reste inchangé
        this.loadingIndicator = false;
        this.isGeneratingReport = false;
        if (this.rows.length === 0 && !this.errorMessage) {
          this.errorMessage = "Aucune donnée trouvée pour les critères spécifiés.";
        } else if (this.rows.length > 0) {
          this.errorMessage = '';
        }
        console.log('État final des lignes affichées:', this.rows);
      },
      // La partie 'error' reste inchangée
      (error: any) => {
        console.error('Erreur lors du chargement du rapport de stock:', error);
        this.errorMessage = `Erreur lors du chargement du rapport: ${error.message || 'Veuillez réessayer.'}`;
        this.loadingIndicator = false;
        this.isGeneratingReport = false;
        this.rows = [];
        this.temp = [];
      }
    );
  }



 downloadRapportStockPDF(): void {
    console.log('--- Tentative d\'impression du rapport de stock PDF ---');
    console.log('Form isValid before API call (PDF):', this.rapportForm.valid);

    if (this.rapportForm.invalid) {
      this.errorMessage = "Veuillez sélectionner un type de rapport et remplir tous les champs obligatoires avant d'imprimer.";
      this.markFormGroupTouched(this.rapportForm);
      console.warn('Formulaire invalide, impression PDF non lancée.');
      return;
    }

    this.isGeneratingReport = true;
    this.errorMessage = '';

    const filters: { [key: string]: any } = { ...this.rapportForm.value };

    filters.date_debut = filters.date_debut ? this.formatDate(filters.date_debut) : null;
    filters.date_fin = filters.date_fin ? this.formatDate(filters.date_fin) : null;

    const finalFilters: { [key: string]: any } = {};

    if (this.selectedReportTypeId === 'entree') {
        finalFilters.id_type_rapport = 'entree';
        finalFilters.id_Article = filters.id_Article_entree;
        finalFilters.id_fournisseur = filters.id_fournisseur_entree;
        const typeEntree = this.typeMouvements.find(t => t.libelle_type_mouvement?.toLowerCase() === 'entrée de stock');
        if (typeEntree) finalFilters.id_type_mouvement = typeEntree.id;

    } else if (this.selectedReportTypeId === 'sortie') {
        finalFilters.id_type_rapport = 'sortie';
        finalFilters.id_Article = filters.id_Article_sortie;
        finalFilters.id_employe = filters.id_employe_sortie;
        const typeSortie = this.typeMouvements.find(t => t.libelle_type_mouvement?.toLowerCase() === 'sortie de stock');
        if (typeSortie) finalFilters.id_type_mouvement = typeSortie.id;

    } else if (this.selectedReportTypeId === 'individuel') {
        finalFilters.id_type_rapport = 'individuel';
        // Pour un rapport individuel, seul l'article est nécessaire.
        // On utilise l'ID de l'article provenant du champ individuel
        finalFilters.id_Article = filters.id_Article_entree;

    } else if (this.selectedReportTypeId === 'etat_stock') {
      // Ce rapport est géré différemment, pas besoin de id_type_rapport
      finalFilters.id_article = filters.id_Article_etat;
      finalFilters.qte_min = filters.qte_min_etat;
      finalFilters.qte_max = filters.qte_max_etat;
    }

    // Ajouter les dates aux filtres finaux, elles sont communes
    if (filters.date_debut) finalFilters.date_debut = filters.date_debut;
    if (filters.date_fin) finalFilters.date_fin = filters.date_fin;

    // Supprimer les champs null ou undefined des filtres finaux
    Object.keys(finalFilters).forEach(key => {
        if (finalFilters[key] === null || finalFilters[key] === undefined || finalFilters[key] === '') {
            delete finalFilters[key];
        }
    });

    console.log('Envoi des filtres AU BACKEND pour le PDF:', finalFilters);

    let pdfCall: Observable<Blob>;
    if (this.selectedReportTypeId === 'etat_stock') {
      pdfCall = this.stockRapportService.imprimerRapportEtatStock(finalFilters);
    } else {
      pdfCall = this.stockRapportService.imprimerRapportData(finalFilters);
    }

    pdfCall.pipe(takeUntil(this.destroy$)).subscribe(
      (response: Blob) => {
        console.log('Réponse PDF reçue du backend.');
        const fileURL = window.URL.createObjectURL(response);
        const a = document.createElement('a');
        a.href = fileURL;
        a.download = `rapport_${this.selectedReportTypeId}_${new Date().toISOString().slice(0,10)}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(fileURL);
        this.isGeneratingReport = false;
      },
      (error: any) => {
        console.error('Erreur lors du téléchargement du PDF du rapport de stock:', error);
        this.errorMessage = `Impossible de télécharger le PDF: ${error.message || 'Veuillez vérifier votre connexion ou contacter l\'administrateur.'}`;
        this.isGeneratingReport = false;
      }
    );
  }











  formatDate(date: NgbDateStruct): string {
    if (!date) return '';
    const year = date.year;
    const month = date.month.toString().padStart(2, '0');
    const day = date.day.toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  updateFilter(event: KeyboardEvent): void {
    const val = (event.target as HTMLInputElement).value.toLowerCase();
    console.log('Valeur de recherche locale:', val);

    if (this.temp.length === 0) {
        this.rows = [];
        return;
    }

    if (this.selectedReportTypeId === 'etat_stock') {
      this.rows = (this.temp as RapportEtatStockArticle[]).filter((item: RapportEtatStockArticle) => {
        let match = false;
        // Utilisez la nouvelle fonction de parsing ici aussi pour la recherche sur les dates
        const derniereEntreeDate = this.parseBackendDateString(item.derniere_entree?.date as string);
        const derniereSortieDate = this.parseBackendDateString(item.derniere_sortie?.date as string);
        const stockActuelDateMaj = this.parseBackendDateString(item.stock_actuel?.date_maj as string);


        const derniereEntreeDateStr = derniereEntreeDate ? derniereEntreeDate.toLocaleDateString('fr-FR') : '';
        const derniereSortieDateStr = derniereSortieDate ? derniereSortieDate.toLocaleDateString('fr-FR') : '';
        const stockActuelDateMajStr = stockActuelDateMaj ? stockActuelDateMaj.toLocaleDateString('fr-FR') : '';

        match = (item.article?.libelle?.toLowerCase().includes(val) || false) ||
                (item.article?.code_article?.toLowerCase().includes(val) || false) ||
                (item.article?.categorie?.toLowerCase().includes(val) || false) ||
                (derniereEntreeDateStr?.toLowerCase().includes(val) || false) ||
                (derniereSortieDateStr?.toLowerCase().includes(val) || false) ||
                (stockActuelDateMajStr?.toLowerCase().includes(val) || false);

        return match;
      });
    } else {
      this.rows = (this.temp as MouvementStock[]).filter((item: MouvementStock) => {
        let match = false;
        // Utilisez la nouvelle fonction de parsing pour la recherche sur date_mouvement
        const dateMouvementObj = this.parseBackendDateString(item.date_mouvement as string);
        const dateMouvementStr = dateMouvementObj ? dateMouvementObj.toLocaleDateString('fr-FR') : (item.date_mouvement || '');

        match = (item.description?.toLowerCase().includes(val) || false) ||
                (item.numero_borderau?.toLowerCase().includes(val) || false) ||
                (item.article?.libelle?.toLowerCase().includes(val) || false) ||
                (item.article?.code_article?.toLowerCase().includes(val) || false) ||
                ((item.fournisseur && item.fournisseur.nom) ? item.fournisseur.nom.toLowerCase().includes(val) : false) ||
                ((item.type_mouvement && item.type_mouvement.libelle_type_mouvement) ? item.type_mouvement.libelle_type_mouvement.toLowerCase().includes(val) : false) ||
                (dateMouvementStr?.toLowerCase().includes(val) || false);
        return match;
      });
    }

    if (this.table) {
      this.table.offset = 0;
    }
  }

}
