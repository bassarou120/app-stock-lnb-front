// src/app/views/pages/rapports/stock/rapport-stock.component.ts
import { Component, ViewChild, OnInit, OnDestroy, inject } from '@angular/core';
import { FormGroup, FormBuilder, Validators, AbstractControl, ValidatorFn } from '@angular/forms';
import { ColumnMode, DatatableComponent, NgxDatatableModule } from '@siemens/ngx-datatable';
import { NgbDateStruct, NgbCalendar, NgbDatepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { CommonModule, DatePipe } from '@angular/common';
import { NgSelectModule } from '@ng-select/ng-select';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { NgbAlertModule, NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
// CORRECTION: Ajustement du chemin pour FeatherIconDirective (si situé plus haut)
import { FeatherIconDirective } from '../../../../core/feather-icon/feather-icon.directive';

// Services
// CORRECTION: Ajustement du chemin pour StockRapportService (si situé dans le même dossier parent que 'rapports')
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
} from '../../../../core/services/interface/models'; // Vérifié: MouvementStock a bien les relations

import { Subject, takeUntil } from 'rxjs';
import { map } from 'rxjs/operators';

// Définir les types de rapport pour les stocks
interface TypeRapportStock {
  id: string; // Utiliser un string comme identifiant unique
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
  rows: MouvementStock[] = []; // Peut contenir MouvementStock pour entrée ou sortie
  temp: MouvementStock[] = [];
  loadingIndicator = false;
  ColumnMode = ColumnMode;

  // Listes pour les dropdowns de filtrage
  articles: Article[] = [];
  fournisseurs: Fournisseur[] = [];
  typeMouvements: TypeMouvement[] = []; // Tous les types de mouvement (entrée, sortie, etc.)
  employes: Employe[] = []; // Pour les sorties éventuellement
  bureaux: Bureau[] = [];

  // Types de rapports de stock
  typeRapportsStock: TypeRapportStock[] = [
    { id: 'entree', libelle: 'Ordre d\'Entrée' },
    { id: 'sortie', libelle: 'Ordre de Sortie' },
  ];
  selectedReportTypeId: string | null = null; // ID du type de rapport sélectionné

  // Indicateurs pour l'affichage conditionnel des filtres
  showEntryFilters: boolean = false;
  showExitFilters: boolean = false;

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
    private employesService: EmployesService, // Injection
    private bureauxService: BureauxService
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.loadFilterData();
    // Écouter les changements sur le type de rapport pour adapter le formulaire
    this.rapportForm.get('id_type_rapport')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(typeRapportId => {
      this.onTypeRapportChange(typeRapportId);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Validateur de plage de dates (utilisé pour entrée et sortie)
  dateRangeValidatorForReport(): ValidatorFn {
    return (group: AbstractControl): { [key: string]: any } | null => {
      const formGroup = group as FormGroup;
      // Les noms des contrôles de date sont génériques (date_debut, date_fin)
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
    this.rapportForm = this.fb.group({
      id_type_rapport: [null, Validators.required],

      // Champs communs aux rapports de stock (dates)
      date_debut: [{ value: null, disabled: true }],
      date_fin: [{ value: null, disabled: true }],

      // Champs spécifiques au rapport d'entrée
      id_Article_entree: [{ value: null, disabled: true }], // id_Article pour entrée
      id_fournisseur_entree: [{ value: null, disabled: true }], // id_fournisseur pour entrée

      // Champs spécifiques au rapport de sortie
      id_Article_sortie: [{ value: null, disabled: true }], // id_Article pour sortie
      id_employe_sortie: [{ value: null, disabled: true }], // id_employe pour sortie
    });
  }

  onTypeRapportChange(typeRapportId: string | null): void {
    this.selectedReportTypeId = typeRapportId;
    this.resetFormControls(); // Réinitialiser tous les contrôles et validateurs

    // Activer les champs de date pour tous les types de rapports de stock, ils sont obligatoires
    this.rapportForm.get('date_debut')?.enable();
    this.rapportForm.get('date_fin')?.enable();
    this.rapportForm.get('date_debut')?.setValidators(Validators.required);
    this.rapportForm.get('date_fin')?.setValidators(Validators.required);
    this.rapportForm.setValidators(this.dateRangeValidatorForReport()); // Appliquer le validateur de plage de date

    switch (typeRapportId) {
      case 'entree':
        this.showEntryFilters = true;
        this.showExitFilters = false;
        // Activer les champs spécifiques à l'entrée
        this.rapportForm.get('id_Article_entree')?.enable();
        this.rapportForm.get('id_fournisseur_entree')?.enable();
        break;

      case 'sortie':
        this.showEntryFilters = false;
        this.showExitFilters = true;
        // Activer les champs spécifiques à la sortie
        this.rapportForm.get('id_Article_sortie')?.enable();
        this.rapportForm.get('id_employe_sortie')?.enable();
        break;

      default:
        this.showEntryFilters = false;
        this.showExitFilters = false;
        // Si aucun type n'est sélectionné, désactiver toutes les dates aussi
        this.rapportForm.get('date_debut')?.disable();
        this.rapportForm.get('date_fin')?.disable();
        this.rapportForm.get('date_debut')?.clearValidators();
        this.rapportForm.get('date_fin')?.clearValidators();
        this.rapportForm.clearValidators(); // Supprimer le validateur de groupe
        this.rapportForm.reset({ id_type_rapport: typeRapportId });
        this.markFormGroupTouched(this.rapportForm);
        break;
    }
    this.rapportForm.updateValueAndValidity(); // Mettre à jour la validation globale du formulaire
    this.errorMessage = '';
    this.rows = [];
    this.temp = [];
  }

  private resetFormControls(): void {
    Object.keys(this.rapportForm.controls).forEach(key => {
      const control = this.rapportForm.get(key);
      if (control && key !== 'id_type_rapport') {
        control.disable();
        control.clearValidators();
        control.setValue(null);
      }
    });
    this.showEntryFilters = false;
    this.showExitFilters = false;
    this.rapportForm.clearValidators(); // Important : Supprimer les validateurs de groupe précédents
    this.rapportForm.updateValueAndValidity();
  }

  loadFilterData(): void {
    // Charger tous les articles
    this.articlesService.getAllArticles().pipe(takeUntil(this.destroy$)).subscribe((data: Article[]) => this.articles = data);
    // Charger tous les fournisseurs
    this.fournisseursService.getAllFournisseurs().pipe(takeUntil(this.destroy$)).subscribe((data: Fournisseur[]) => this.fournisseurs = data);
    // Charger tous les types de mouvement (pourrait être filtré par la suite si nécessaire)
    this.typeMouvementService.getAllTypeMouvement().pipe(takeUntil(this.destroy$)).subscribe((data: TypeMouvement[]) => this.typeMouvements = data);
    // Charger tous les employés (pour les sorties)
    this.employesService.getAllEmployes().pipe(takeUntil(this.destroy$)).subscribe((data: Employe[]) => this.employes = data);
    // Charger tous les employés (pour les sorties)
    this.bureauxService.getAllBureaux().pipe(takeUntil(this.destroy$)).subscribe((data: Bureau[]) => this.bureaux = data);
  }

  loadRapportStock(): void {
    console.log('--- Tentative de chargement du rapport de stock ---');
    console.log('Form isValid before API call:', this.rapportForm.valid);
    console.log('Form errors (group level):', this.rapportForm.errors);
    Object.keys(this.rapportForm.controls).forEach(key => {
      if (this.rapportForm.get(key)?.errors) {
        console.log(`Errors on control ${key}:`, this.rapportForm.get(key)?.errors);
      }
    });

    if (this.rapportForm.invalid) {
      this.errorMessage = "Veuillez sélectionner un type de rapport et remplir tous les champs obligatoires.";
      this.markFormGroupTouched(this.rapportForm);
      console.warn('Formulaire invalide, requête non envoyée.');
      return;
    }

    this.isGeneratingReport = true;
    this.loadingIndicator = true;
    this.errorMessage = '';

    const filters: { [key: string]: any } = { ...this.rapportForm.value };

    // Formatage des dates communes
    filters.date_debut = filters.date_debut ? this.formatDate(filters.date_debut) : null;
    filters.date_fin = filters.date_fin ? this.formatDate(filters.date_fin) : null;

    // Nettoyage et renommage des filtres avant envoi en fonction du type de rapport
    if (this.selectedReportTypeId === 'entree') {
        filters.id_Article = filters.id_Article_entree;
        filters.id_fournisseur = filters.id_fournisseur_entree;
        // Supprimer les champs spécifiques à l'autre rapport
        delete filters.id_Article_entree;
        delete filters.id_fournisseur_entree;
        delete filters.id_Article_sortie;
        delete filters.id_employe_sortie;
        // Ajouter le type de mouvement pour l'entrée
        const typeEntree = this.typeMouvements.find(t => t.libelle_type_mouvement?.toLowerCase() === 'entrée');
        if (typeEntree) {
            filters.id_type_mouvement = typeEntree.id;
        } else {
            console.warn("Type de mouvement 'entrée' non trouvé. Veuillez vérifier les données.");
            // Potentiellement lancer une erreur ou gérer ce cas
        }

    } else if (this.selectedReportTypeId === 'sortie') {
        filters.id_Article = filters.id_Article_sortie;
        filters.id_employe = filters.id_employe_sortie; // Ou tout autre champ lié à l'employé
        // Supprimer les champs spécifiques à l'autre rapport
        delete filters.id_Article_entree;
        delete filters.id_fournisseur_entree;
        delete filters.id_Article_sortie;
        delete filters.id_employe_sortie;
        // Ajouter le type de mouvement pour la sortie
        const typeSortie = this.typeMouvements.find(t => t.libelle_type_mouvement?.toLowerCase() === 'sortie');
        if (typeSortie) {
            filters.id_type_mouvement = typeSortie.id;
        } else {
            console.warn("Type de mouvement 'sortie' non trouvé. Veuillez vérifier les données.");
        }
    }

    // Supprimer les champs qui sont null ou undefined pour éviter d'envoyer des paramètres inutiles
    Object.keys(filters).forEach(key => {
        if (filters[key] === null || filters[key] === undefined || filters[key] === '') {
            delete filters[key];
        }
    });

    console.log('Envoi des filtres au backend pour le rapport de stock:', filters);

    this.stockRapportService.getRapportData(filters).pipe(takeUntil(this.destroy$)).subscribe(
      (response: BackendPostResource<PaginatedResponse<MouvementStock>>) => {
        console.log('Réponse du backend (brute du service):', response);
        if (response.success && response.data && response.data.data) {
          this.rows = response.data.data;
          this.temp = [...response.data.data];
        } else {
          this.rows = [];
          this.temp = [];
          this.errorMessage = response.message || "Aucune donnée trouvée ou erreur inattendue.";
        }

        this.loadingIndicator = false;
        this.isGeneratingReport = false;
        if (this.rows.length === 0 && !this.errorMessage) {
          this.errorMessage = "Aucune donnée trouvée pour les critères spécifiés.";
        } else if (this.rows.length > 0) {
          this.errorMessage = '';
        }
        console.log('Données du rapport de stock chargées et affichées:', this.rows);
      },
      (error: any) => {
        console.error('Erreur lors du chargement du rapport de stock:', error);
        this.errorMessage = `Erreur lors du chargement du rapport de stock: ${error.message || 'Veuillez réessayer.'}`;
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
    console.log('Form errors (PDF):', this.rapportForm.errors);
    Object.keys(this.rapportForm.controls).forEach(key => {
      if (this.rapportForm.get(key)?.errors) {
        console.log(`Errors on control ${key} (PDF):`, this.rapportForm.get(key)?.errors);
      }
    });

    if (this.rapportForm.invalid) {
      this.errorMessage = "Veuillez sélectionner un type de rapport et remplir tous les champs obligatoires avant d'imprimer.";
      this.markFormGroupTouched(this.rapportForm);
      console.warn('Formulaire invalide, impression PDF non lancée.');
      return;
    }

    this.isGeneratingReport = true;
    this.errorMessage = '';

    const filters: { [key: string]: any } = { ...this.rapportForm.value };

    // Formatage des dates communes
    filters.date_debut = filters.date_debut ? this.formatDate(filters.date_debut) : null;
    filters.date_fin = filters.date_fin ? this.formatDate(filters.date_fin) : null;

    // Nettoyage et renommage des filtres avant envoi en fonction du type de rapport
    if (this.selectedReportTypeId === 'entree') {
        filters.id_Article = filters.id_Article_entree;
        filters.id_fournisseur = filters.id_fournisseur_entree;
        delete filters.id_Article_entree;
        delete filters.id_fournisseur_entree;
        delete filters.id_Article_sortie;
        delete filters.id_employe_sortie;
        const typeEntree = this.typeMouvements.find(t => t.libelle_type_mouvement?.toLowerCase() === 'entrée');
        if (typeEntree) {
            filters.id_type_mouvement = typeEntree.id;
        }

    } else if (this.selectedReportTypeId === 'sortie') {
        filters.id_Article = filters.id_Article_sortie;
        filters.id_employe = filters.id_employe_sortie;
        delete filters.id_Article_entree;
        delete filters.id_fournisseur_entree;
        delete filters.id_Article_sortie;
        delete filters.id_employe_sortie;
        const typeSortie = this.typeMouvements.find(t => t.libelle_type_mouvement?.toLowerCase() === 'sortie');
        if (typeSortie) {
            filters.id_type_mouvement = typeSortie.id;
        }
    }

    Object.keys(filters).forEach(key => {
        if (filters[key] === null || filters[key] === undefined || filters[key] === '') {
            delete filters[key];
        }
    });

    console.log('Envoi des filtres pour PDF au backend pour le rapport de stock:', filters);

    this.stockRapportService.imprimerRapportData(filters).pipe(takeUntil(this.destroy$)).subscribe(
      (response: Blob) => {
        console.log('Réponse PDF reçue du backend.');
        const fileURL = window.URL.createObjectURL(response);
        const a = document.createElement('a');
        a.href = fileURL;
        a.download = `rapport_stock_${this.selectedReportTypeId}.pdf`; // Nom de fichier dynamique
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

    if (this.temp.length > 0) {
        this.rows = this.temp.filter((item: MouvementStock) => {
            let match = false;
            // Accès sécurisé aux propriétés, vérifiant si ce sont des objets avant d'accéder aux sous-propriétés
            match = (item.description?.toLowerCase().includes(val) || false) ||
                    (item.numero_borderau?.toLowerCase().includes(val) || false) ||
                    (item.article?.libelle?.toLowerCase().includes(val) || false) ||
                    (item.article?.code_article?.toLowerCase().includes(val) || false) ||
                    ((typeof item.fournisseur === 'object' && item.fournisseur !== null) ? item.fournisseur.nom?.toLowerCase().includes(val) : false) ||
                    ((typeof item.type_mouvement === 'object' && item.type_mouvement !== null) ? item.type_mouvement.libelle_type_mouvement?.toLowerCase().includes(val) : false)
                    ;
            return match;
        });
    } else {
        this.rows = [];
    }

    if (this.table) {
      this.table.offset = 0;
    }
  }

}
