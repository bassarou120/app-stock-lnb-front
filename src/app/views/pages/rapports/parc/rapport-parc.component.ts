// src/app/views/pages/rapports/parc/rapport-parc.component.ts
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
import { ParcRapportService, BackendPostResource } from '../../../../core/services/rapport/parc-rapport.service'; // Nouveau service
import { VehiculeService } from '../../../../core/services/vehicules/vehicules.service';
import { TypeInterventionService } from '../../../../core/services/types-intervention/types-intervention.service'; // Assurez-vous que ce service existe
import { MarquesService } from '../../../../core/services/marques/marques.service'; // Assurez-vous que ce service existe
import { ModelesService } from '../../../../core/services/modeles/modeles.service'; // Assurez-vous que ce service existe

// Interfaces
import {
  Vehicule, InterventionVehicule, TypeIntervention, Marque, Modele, PaginatedResponse
} from '../../../../core/services/interface/models';

import { Subject, takeUntil } from 'rxjs';

// Définir les types de rapport pour le parc
interface TypeRapportParc {
  id: string; // 'vehicule' ou 'intervention_vehicule'
  libelle: string;
}

@Component({
  selector: 'app-rapport-parc', // Renommé pour être spécifique aux rapports de parc
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
  templateUrl: './rapport-parc.component.html', // Chemin du nouveau template
  styleUrls: []
})
export class RapportParcComponent implements OnInit, OnDestroy {
  @ViewChild('table') table!: DatatableComponent;

  rapportForm!: FormGroup;
  rows: (Vehicule | InterventionVehicule)[] = [];
  temp: (Vehicule | InterventionVehicule)[] = [];
  loadingIndicator = false;
  ColumnMode = ColumnMode;

  // Listes pour les dropdowns de filtrage
  vehiculesList: Vehicule[] = []; // Liste de tous les véhicules (pour filtres d'intervention)
  typeInterventionsList: TypeIntervention[] = []; // Liste de tous les types d'intervention
  marquesList: Marque[] = []; // Liste de toutes les marques
  modelesList: Modele[] = []; // Liste de tous les modèles

  // Types de rapports de parc
  typeRapportsParc: TypeRapportParc[] = [
    { id: 'vehicule', libelle: 'Rapport d\'Enregistrement des Véhicules' },
    { id: 'intervention_vehicule', libelle: 'Rapport des Interventions sur Véhicules' }
  ];
  selectedReportTypeId: string | null = null; // ID du type de rapport sélectionné

  // Indicateurs pour l'affichage conditionnel des filtres
  showVehiculeFilters: boolean = false;
  showInterventionVFilters: boolean = false;

  errorMessage: string = '';
  isGeneratingReport = false;
  currentDate: NgbDateStruct = inject(NgbCalendar).getToday();
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private parcRapportService: ParcRapportService, // Nouveau service
    private vehiculesService: VehiculeService,
    private typeInterventionService: TypeInterventionService,
    private marquesService: MarquesService,
    private modelesService: ModelesService,
  ) { }

  ngOnInit(): void {
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

  // Validateur générique de plage de dates
  dateRangeValidatorForReport(startDateControlName: string, endDateControlName: string): ValidatorFn {
    return (group: AbstractControl): { [key: string]: any } | null => {
      const formGroup = group as FormGroup;
      const startDateControl = formGroup.get(startDateControlName);
      const endDateControl = formGroup.get(endDateControlName);

      const startDate = startDateControl?.value as NgbDateStruct;
      const endDate = endDateControl?.value as NgbDateStruct;

      if (!startDate && endDate) {
        return { 'dateRangeMissingStartDate': true };
      }
      if (startDate && !endDate) {
        return { 'dateRangeMissingEndDate': true };
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

      // Filtres pour Rapport Véhicule
      date_debut_vehicule: [null],
      date_fin_vehicule: [null],
      modele_id: [null],
      marque_id: [null],

      // Filtres pour Rapport Intervention Véhicule
      date_debut_intervention_v: [null],
      date_fin_intervention_v: [null],
      vehicule_id: [null],
      type_intervention_id: [null],
    });
  }

  onTypeRapportChange(typeRapportId: string | null): void {
    this.selectedReportTypeId = typeRapportId;
    this.resetFormControls(); // Réinitialise et désactive tous les champs

    // Réactive le sélecteur de type de rapport (il ne doit jamais être désactivé)
    this.rapportForm.get('id_type_rapport')?.enable();
    this.rapportForm.get('id_type_rapport')?.setValidators(Validators.required);
    this.rapportForm.clearValidators(); // Efface les validateurs de niveau FormGroup pour éviter les conflits initiaux

    switch (typeRapportId) {
      case 'vehicule':
        this.showVehiculeFilters = true;
        this.showInterventionVFilters = false;
        
        this.rapportForm.get('date_debut_vehicule')?.enable();
        this.rapportForm.get('date_fin_vehicule')?.enable();
        this.rapportForm.get('modele_id')?.enable();
        this.rapportForm.get('marque_id')?.enable();

        // Les dates d'acquisition sont optionnelles dans le backend, donc pas de Validators.required
        // On n'ajoute pas de validateur de plage de dates au niveau du formulaire pour ce cas, car les dates sont optionnelles.
        // Si les deux dates sont remplies, la validation de la plage se fera via le backend ou si nous ajoutons un validateur custom qui s'active si les DEUX sont remplis.
        break;

      case 'intervention_vehicule':
        this.showVehiculeFilters = false;
        this.showInterventionVFilters = true;

        this.rapportForm.get('date_debut_intervention_v')?.enable();
        this.rapportForm.get('date_fin_intervention_v')?.enable();
        this.rapportForm.get('vehicule_id')?.enable();
        this.rapportForm.get('type_intervention_id')?.enable();

        // Les dates d'intervention sont obligatoires
        this.rapportForm.get('date_debut_intervention_v')?.setValidators(Validators.required);
        this.rapportForm.get('date_fin_intervention_v')?.setValidators(Validators.required);
        this.rapportForm.setValidators(this.dateRangeValidatorForReport('date_debut_intervention_v', 'date_fin_intervention_v'));
        break;

      default:
        this.showVehiculeFilters = false;
        this.showInterventionVFilters = false;
        this.rapportForm.reset({ id_type_rapport: typeRapportId });
        // S'assurer que les dates sont nulles si aucun rapport n'est sélectionné
        this.rapportForm.get('date_debut_vehicule')?.setValue(null);
        this.rapportForm.get('date_fin_vehicule')?.setValue(null);
        this.rapportForm.get('date_debut_intervention_v')?.setValue(null);
        this.rapportForm.get('date_fin_intervention_v')?.setValue(null);
        break;
    }
    this.rapportForm.updateValueAndValidity(); // Recalculer la validité après les changements
    this.errorMessage = '';
    this.rows = [];
    this.temp = [];
  }

  private resetFormControls(): void {
    // Liste de tous les contrôles, sauf 'id_type_rapport'
    const allControls = [
      'date_debut_vehicule', 'date_fin_vehicule', 'modele_id', 'marque_id',
      'date_debut_intervention_v', 'date_fin_intervention_v', 'vehicule_id', 'type_intervention_id'
    ];

    allControls.forEach(key => {
      const control = this.rapportForm.get(key);
      if (control) {
        control.disable();
        control.clearValidators();
        control.setValue(null);
      }
    });

    this.rapportForm.clearValidators(); // Efface les validateurs de niveau FormGroup
    this.rapportForm.get('id_type_rapport')?.setValidators(Validators.required); // Ré-applique le validateur pour le type de rapport
    this.rapportForm.updateValueAndValidity(); // Très important
    this.showVehiculeFilters = false;
    this.showInterventionVFilters = false;
  }

  loadFilterData(): void {
    this.vehiculesService.getAllVehicules().pipe(takeUntil(this.destroy$)).subscribe((data: Vehicule[]) => this.vehiculesList = data);
    this.typeInterventionService.getAllTypeInterventions().pipe(takeUntil(this.destroy$)).subscribe((data: TypeIntervention[]) => this.typeInterventionsList = data);
    this.marquesService.getAllMarques().pipe(takeUntil(this.destroy$)).subscribe((data: Marque[]) => this.marquesList = data);
    this.modelesService.getAllModeles().pipe(takeUntil(this.destroy$)).subscribe((data: Modele[]) => this.modelesList = data);
  }

  loadRapportParc(): void {
    console.log('--- Tentative de chargement du rapport de parc ---');
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

    const filters: { [key: string]: any } = {
        id_type_rapport: this.selectedReportTypeId, // Toujours inclure le type de rapport
    };

    if (this.selectedReportTypeId === 'vehicule') {
        filters.date_debut = this.formatDate(this.rapportForm.get('date_debut_vehicule')?.value);
        filters.date_fin = this.formatDate(this.rapportForm.get('date_fin_vehicule')?.value);
        filters.modele_id = this.rapportForm.get('modele_id')?.value;
        filters.marque_id = this.rapportForm.get('marque_id')?.value;
    } else if (this.selectedReportTypeId === 'intervention_vehicule') {
        filters.date_debut = this.formatDate(this.rapportForm.get('date_debut_intervention_v')?.value);
        filters.date_fin = this.formatDate(this.rapportForm.get('date_fin_intervention_v')?.value);
        filters.vehicule_id = this.rapportForm.get('vehicule_id')?.value;
        filters.type_intervention_id = this.rapportForm.get('type_intervention_id')?.value;
    }

    // Nettoyer les filtres vides avant l'envoi
    Object.keys(filters).forEach(key => {
        if (filters[key] === null || filters[key] === undefined || filters[key] === '') {
            delete filters[key];
        }
    });

    console.log('Envoi des filtres au backend pour le rapport de parc:', filters);

    this.parcRapportService.getRapportData(filters).pipe(takeUntil(this.destroy$)).subscribe(
      (response: BackendPostResource<PaginatedResponse<Vehicule | InterventionVehicule>>) => {
        console.log('Réponse du backend (brute du service Parc):', response);
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
        console.log('Données du rapport de parc chargées et affichées:', this.rows);
      },
      (error: any) => {
        console.error('Erreur lors du chargement du rapport de parc:', error);
        this.errorMessage = `Erreur lors du chargement du rapport de parc: ${error.message || 'Veuillez réessayer.'}`;
        this.loadingIndicator = false;
        this.isGeneratingReport = false;
        this.rows = [];
        this.temp = [];
      }
    );
  }

  downloadRapportParcPDF(): void {
    console.log('--- Tentative d\'impression du rapport de parc PDF ---');
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

    const filters: { [key: string]: any } = {
        id_type_rapport: this.selectedReportTypeId, // Toujours inclure le type de rapport
    };

    if (this.selectedReportTypeId === 'vehicule') {
        filters.date_debut = this.formatDate(this.rapportForm.get('date_debut_vehicule')?.value);
        filters.date_fin = this.formatDate(this.rapportForm.get('date_fin_vehicule')?.value);
        filters.modele_id = this.rapportForm.get('modele_id')?.value;
        filters.marque_id = this.rapportForm.get('marque_id')?.value;
    } else if (this.selectedReportTypeId === 'intervention_vehicule') {
        filters.date_debut = this.formatDate(this.rapportForm.get('date_debut_intervention_v')?.value);
        filters.date_fin = this.formatDate(this.rapportForm.get('date_fin_intervention_v')?.value);
        filters.vehicule_id = this.rapportForm.get('vehicule_id')?.value;
        filters.type_intervention_id = this.rapportForm.get('type_intervention_id')?.value;
    }
    
    Object.keys(filters).forEach(key => {
        if (filters[key] === null || filters[key] === undefined || filters[key] === '') {
            delete filters[key];
        }
    });

    console.log('Envoi des filtres pour PDF au backend pour le rapport de parc:', filters);

    this.parcRapportService.imprimerRapportData(filters).pipe(takeUntil(this.destroy$)).subscribe(
      (response: Blob) => {
        console.log('Réponse PDF reçue du backend.');
        const fileURL = window.URL.createObjectURL(response);
        const a = document.createElement('a');
        a.href = fileURL;
        a.download = `rapport_parc_${this.selectedReportTypeId}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(fileURL);
        this.isGeneratingReport = false;
      },
      (error: any) => {
        console.error('Erreur lors du téléchargement du PDF du rapport de parc:', error);
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
        this.rows = this.temp.filter(item => {
            let match = false;
            if (this.selectedReportTypeId === 'vehicule') {
                const vehicule = item as Vehicule;
                match = (vehicule.immatriculation?.toLowerCase().includes(val) || false) ||
                        (vehicule.numero_chassis?.toLowerCase().includes(val) || false) ||
                        (vehicule.marque?.libelle?.toLowerCase().includes(val) || false) ||
                        (vehicule.modele?.libelle_modele?.toLowerCase().includes(val) || false)
                        ;
            } else if (this.selectedReportTypeId === 'intervention_vehicule') {
                const intervention = item as InterventionVehicule;
                match = (intervention.titre?.toLowerCase().includes(val) || false) ||
                        (intervention.observation?.toLowerCase().includes(val) || false) ||
                        (intervention.vehicule?.immatriculation?.toLowerCase().includes(val) || false) ||
                        (intervention.vehicule?.marque?.libelle?.toLowerCase().includes(val) || false) ||
                        (intervention.vehicule?.modele?.libelle_modele?.toLowerCase().includes(val) || false) ||
                        (intervention.typeIntervention?.libelle_type_intervention?.toLowerCase().includes(val) || false);
            }
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
