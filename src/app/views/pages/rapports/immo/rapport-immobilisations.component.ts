// src/app/views/pages/rapport/immobilisations/rapport-immobilisations.component.ts
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
import { ImmobilisationRapportService } from '../../../../core/services/rapport/immobilisation-rapport.service';
import { BackendPostResource } from '../../../../core/services/interface/models';
import { BureauxService } from '../../../../core/services/bureaux/bureaux.service';
import { EmployesService } from '../../../../core/services/employes/employes.service';
import { FournisseursService } from '../../../../core/services/fournisseurs/fournisseurs.service';
import { GroupeTypeImmoService } from '../../../../core/services/groupe-type-immo/groupe-type-immo.service';
import { SousTypeImmoService } from '../../../../core/services/sous-type-immo/sous-type-immo.service';
import { StatusImmoService } from '../../../../core/services/status-immo/status-immo.service';
import { VehiculeService } from '../../../../core/services/vehicules/vehicules.service';
import { ImmobilisationsService } from '../../../../core/services/enregistrement-immos/enregistrement-immos.service';
import { TypeInterventionService } from '../../../../core/services/types-intervention/types-intervention.service';

// Interfaces
import {
  Immobilisation, Bureau, Employe, Fournisseur,
  GroupeTypeImmo, SousTypeImmo, StatusImmo, Vehicule, PaginatedResponse, Transfert, Intervention, TypeIntervention
} from '../../../../core/services/interface/models';
import { Subject, takeUntil } from 'rxjs';
import { map, distinct } from 'rxjs/operators';

// Définir les types de rapport pour les immobilisations
interface TypeRapportImmo {
  id: string; // Utiliser un string comme identifiant unique
  libelle: string;
}

@Component({
  selector: 'app-rapport-immobilisations',
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
  providers: [
    DatePipe
  ],
  templateUrl: './rapport-immobilisations.component.html',
  styleUrls: []
})
export class RapportImmobilisationsComponent implements OnInit, OnDestroy {
  @ViewChild('table') table!: DatatableComponent;

  rapportForm!: FormGroup;
  rows: (Immobilisation | Transfert | Intervention)[] = []; // Type de données élargi
  temp: (Immobilisation | Transfert | Intervention)[] = []; // Type de données élargi
  loadingIndicator = false;
  ColumnMode = ColumnMode;

  // Listes pour les dropdowns de filtrage
  bureaux: Bureau[] = [];
  employes: Employe[] = [];
  fournisseurs: Fournisseur[] = [];
  groupeTypesImmo: GroupeTypeImmo[] = [];
  sousTypesImmo: SousTypeImmo[] = [];
  statusImmos: StatusImmo[] = [];
  vehicules: Vehicule[] = [];
  immobilisationCodes: string[] = []; // Pour le rapport d'enregistrement
  immobilisations: Immobilisation[] = []; // NOUVEAU: Pour le filtre des interventions
  typeInterventions: TypeIntervention[] = []; // NOUVEAU: Pour le filtre des interventions
  intervention_immo: Intervention[] = [];

  // NOUVEAU: Types de rapports
  typeRapportsImmo: TypeRapportImmo[] = [
    { id: 'enregistrement', libelle: 'Rapport d\'Enregistrement des Immobilisations' },
    { id: 'transfert', libelle: 'Rapport des Transferts d\'Immobilisations' },
    { id: 'intervention', libelle: 'Rapport des Interventions sur Immobilisations' },
    { id: 'intervention', libelle: 'Fiche d\'inventaire' },
  ];
  selectedReportTypeId: string | null = null; // ID du type de rapport sélectionné

  // Indicateurs pour l'affichage conditionnel des filtres
  showRegistrationFilters: boolean = false;
  showTransferFilters: boolean = false;
  showInterventionFilters: boolean = false; // NOUVEAU

  errorMessage: string = '';
  isGeneratingReport = false;
  currentDate: NgbDateStruct = inject(NgbCalendar).getToday();
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private rapportService: ImmobilisationRapportService, // Ce service gérera les deux types de rapports
    private bureauxService: BureauxService,
    private employesService: EmployesService,
    private fournisseursService: FournisseursService,
    private groupeTypeImmoService: GroupeTypeImmoService,
    private sousTypeImmoService: SousTypeImmoService,
    private statusImmoService: StatusImmoService,
    private vehiculeService: VehiculeService,
    private immobilisationsService: ImmobilisationsService,
    private TypeInterventionService: TypeInterventionService,
    public datePipe: DatePipe,
    private ngbCalendar: NgbCalendar
  ) {
    console.log('RapportImmobilisationsComponent: Constructor called.');
  }

  ngOnInit(): void {
    console.log('RapportImmobilisationsComponent: ngOnInit called. Initializing form and loading filter data...');
    this.initForm();
    this.loadFilterData();
    this.loadInterventions_immo();
    this.loadImmobilisationCodes(); // Toujours charger si le rapport d'enregistrement existe
    this.loadImmobilisationsForFilter(); // NOUVEAU: Charger les immobilisations pour le filtre d'intervention
    this.loadTypeInterventionsForFilter(); // NOUVEAU: Charger les types d'intervention pour le filtre
    // Écouter les changements sur le type de rapport pour adapter le formulaire
    this.rapportForm.get('id_type_rapport')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(typeRapportId => {
      console.log('Rapport type changed to:', typeRapportId);
      this.onTypeRapportChange(typeRapportId);
    });
  }

  ngOnDestroy(): void {
    console.log('RapportImmobilisationsComponent: ngOnDestroy called. Cleaning up subscriptions.');
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Validateur de plage de dates (utilisé pour les transferts et les interventions)
  dateRangeValidatorForReport(): ValidatorFn {
    return (group: AbstractControl): { [key: string]: any } | null => {
      const formGroup = group as FormGroup;
      let startDateControlName: string;
      let endDateControlName: string;

      if (this.selectedReportTypeId === 'transfert') {
        startDateControlName = 'date_debut_mouvement';
        endDateControlName = 'date_fin_mouvement';
      } else if (this.selectedReportTypeId === 'intervention') {
        startDateControlName = 'date_debut_intervention';
        endDateControlName = 'date_fin_intervention';
      } else if (this.selectedReportTypeId === 'inventaire') {
        startDateControlName = 'date_debut_inventaire';
        endDateControlName = 'date_fin_inventaire';
      } else {
        return null;
      }

      const startDateControl = formGroup.get(startDateControlName);
      const endDateControl = formGroup.get(endDateControlName);

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
    const today = this.ngbCalendar.getToday();
    const firstDayOfMonth: NgbDateStruct = { year: today.year, month: today.month, day: 1 };

    this.rapportForm = this.fb.group({
      id_type_rapport: [null, Validators.required],

      // Pas de 'disabled: true' ici. La désactivation sera gérée par resetFormControls
      code_immo: [null],
      date_debut_acquisition: [firstDayOfMonth],

      date_debut_mouvement: [firstDayOfMonth],
      date_fin_mouvement: [today],
      old_bureau_id: [null],
      bureau_id: [null],
      old_employe_id: [null],
      employe_id: [null],

      date_debut_intervention: [firstDayOfMonth],
      date_fin_intervention: [today],
      type_intervention_id: [null],
      immo_id: [null],

      date_debut_inventaire: [firstDayOfMonth],
      date_fin_inventaire: [today],
    });
    console.log('RapportImmobilisationsComponent: Form initialized with default dates (controls not disabled yet).');
  }

  onTypeRapportChange(typeRapportId: string | null): void {
    console.log('onTypeRapportChange: Type Rapport ID:', typeRapportId);
    this.selectedReportTypeId = typeRapportId;
    this.resetFormControls(); // Réinitialise TOUS les contrôles à null et les désactive

    const today = this.ngbCalendar.getToday();
    const firstDayOfMonth: NgbDateStruct = { year: today.year, month: today.month, day: 1 };

    switch (typeRapportId) {
      case 'enregistrement':
        this.showRegistrationFilters = true;
        this.rapportForm.get('date_debut_acquisition')?.setValue(firstDayOfMonth);
        console.log('Set date_debut_acquisition to:', this.rapportForm.get('date_debut_acquisition')?.value);
        this.enableAndSetValidators(['code_immo', 'date_debut_acquisition'], this.rapportForm);
        this.rapportForm.get('date_debut_acquisition')?.clearValidators();
        this.rapportForm.get('date_debut_acquisition')?.updateValueAndValidity();
        this.rapportForm.clearValidators();
        console.log('onTypeRapportChange: Showing registration filters.');
        break;

      case 'transfert':
        this.showRegistrationFilters = false;
        this.showTransferFilters = true;
        this.rapportForm.get('date_debut_mouvement')?.setValue(firstDayOfMonth);
        console.log('Set date_debut_mouvement to:', this.rapportForm.get('date_debut_mouvement')?.value);
        this.rapportForm.get('date_fin_mouvement')?.setValue(today);
        console.log('Set date_fin_mouvement to:', this.rapportForm.get('date_fin_mouvement')?.value);
        this.enableAndSetValidators([
          'date_debut_mouvement', 'date_fin_mouvement',
          'old_bureau_id', 'bureau_id',
          'old_employe_id', 'employe_id'
        ], this.rapportForm);

        this.rapportForm.get('date_debut_mouvement')?.setValidators(Validators.required);
        this.rapportForm.get('date_fin_mouvement')?.setValidators(Validators.required);
        this.rapportForm.setValidators(this.dateRangeValidatorForReport());
        this.rapportForm.get('date_debut_mouvement')?.updateValueAndValidity();
        this.rapportForm.get('date_fin_mouvement')?.updateValueAndValidity();
        console.log('onTypeRapportChange: Showing transfer filters.');
        break;

      case 'intervention':
        this.showInterventionFilters = true;
        this.rapportForm.get('date_debut_intervention')?.setValue(firstDayOfMonth);
        console.log('Set date_debut_intervention to:', this.rapportForm.get('date_debut_intervention')?.value);
        this.rapportForm.get('date_fin_intervention')?.setValue(today);
        console.log('Set date_fin_intervention to:', this.rapportForm.get('date_fin_intervention')?.value);
        this.enableAndSetValidators([
          'date_debut_intervention', 'date_fin_intervention',
          'type_intervention_id', 'immo_id'
        ], this.rapportForm);

        this.rapportForm.get('date_debut_intervention')?.setValidators(Validators.required);
        this.rapportForm.get('date_fin_intervention')?.setValidators(Validators.required);
        this.rapportForm.setValidators(this.dateRangeValidatorForReport());
        this.rapportForm.get('date_debut_intervention')?.updateValueAndValidity();
        this.rapportForm.get('date_fin_intervention')?.updateValueAndValidity();
        console.log('onTypeRapportChange: Showing intervention filters.');
        break;

      case 'inventaire':
        this.showInventoryFilters = true;
        this.rapportForm.get('date_debut_inventaire')?.setValue(firstDayOfMonth);
        console.log('Set date_debut_inventaire to:', this.rapportForm.get('date_debut_inventaire')?.value);
        this.rapportForm.get('date_fin_inventaire')?.setValue(today);
        console.log('Set date_fin_inventaire to:', this.rapportForm.get('date_fin_inventaire')?.value);
        this.enableAndSetValidators([
          'date_debut_inventaire', 'date_fin_inventaire'
        ], this.rapportForm);
        this.rapportForm.get('date_debut_inventaire')?.setValidators(Validators.required);
        this.rapportForm.get('date_fin_inventaire')?.setValidators(Validators.required);
        this.rapportForm.setValidators(this.dateRangeValidatorForReport());
        this.rapportForm.get('date_debut_inventaire')?.updateValueAndValidity();
        this.rapportForm.get('date_fin_inventaire')?.updateValueAndValidity();
        console.log('onTypeRapportChange: Showing inventory filters.');
        break;

      default:
        this.showRegistrationFilters = false;
        this.showTransferFilters = false;
        this.showInterventionFilters = false;
        this.showInventoryFilters = false;
        this.rapportForm.reset({ id_type_rapport: typeRapportId });
        this.markFormGroupTouched(this.rapportForm);
        this.rapportForm.clearValidators();
        console.log('onTypeRapportChange: No specific report type selected or unknown.');
        break;
    }
    this.rapportForm.updateValueAndValidity();
    this.errorMessage = '';
    this.rows = [];
    this.temp = [];
    console.log('onTypeRapportChange: Form updated and errors/rows cleared.');
  }

  private enableAndSetValidators(controlNames: string[], formGroup: FormGroup): void {
    controlNames.forEach(name => {
      const control = formGroup.get(name);
      if (control) {
        control.enable(); // Active le contrôle
        control.updateValueAndValidity();
        console.log(`Control '${name}' enabled and validators updated.`);
      }
    });
  }

  private resetFormControls(): void {
    Object.keys(this.rapportForm.controls).forEach(key => {
      const control = this.rapportForm.get(key);
      if (control && key !== 'id_type_rapport') {
        control.setValue(null); // Définit la valeur à null
        control.clearValidators(); // Efface les validateurs
        control.disable(); // Désactive le contrôle
        console.log(`Control '${key}' reset to null, disabled, and validators cleared.`);
      }
    });
    this.showRegistrationFilters = false;
    this.showTransferFilters = false;
    this.showInterventionFilters = false;
    this.showInventoryFilters = false;
    this.rapportForm.clearValidators();
    this.rapportForm.updateValueAndValidity();
    console.log('All non-type-rapport form controls reset and filters hidden.');
  }

  loadFilterData(): void {
    console.log('Loading filter data...');
    this.bureauxService.getAllBureaux().pipe(takeUntil(this.destroy$)).subscribe(
      (data: Bureau[]) => { this.bureaux = data; console.log('Bureaux loaded:', data.length); },
      (error) => console.error('Error loading bureaux:', error)
    );
    this.employesService.getAllEmployes().pipe(takeUntil(this.destroy$)).subscribe(
      (data: Employe[]) => { this.employes = data; console.log('Employes loaded:', data.length); },
      (error) => console.error('Error loading employes:', error)
    );
    this.fournisseursService.getAllFournisseurs().pipe(takeUntil(this.destroy$)).subscribe(
      (data: Fournisseur[]) => { this.fournisseurs = data; console.log('Fournisseurs loaded:', data.length); },
      (error) => console.error('Error loading fournisseurs:', error)
    );
    this.groupeTypeImmoService.getAllGroupeTypeImmos().pipe(takeUntil(this.destroy$)).subscribe(
      (data: GroupeTypeImmo[]) => { this.groupeTypesImmo = data; console.log('GroupeTypesImmo loaded:', data.length); },
      (error) => console.error('Error loading groupeTypeImmos:', error)
    );
    this.sousTypeImmoService.getAllSousTypeImmos().pipe(takeUntil(this.destroy$)).subscribe(
      (data: SousTypeImmo[]) => { this.sousTypesImmo = data; console.log('SousTypeImmos loaded:', data.length); },
      (error) => console.error('Error loading sousTypeImmos:', error)
    );
    this.statusImmoService.getAllStatusImmos().pipe(takeUntil(this.destroy$)).subscribe(
      (data: StatusImmo[]) => { this.statusImmos = data; console.log('StatusImmos loaded:', data.length); },
      (error) => console.error('Error loading statusImmos:', error)
    );
    this.vehiculeService.getAllVehicules().pipe(takeUntil(this.destroy$)).subscribe(
      (data: Vehicule[]) => { this.vehicules = data; console.log('Vehicules loaded:', data.length); },
      (error) => console.error('Error loading vehicules:', error)
    );
  }

  loadImmobilisationCodes(): void {
    console.log('Loading immobilisation codes...');
    this.immobilisationsService.getAllImmobilisations().pipe(
      map((immobilisations: Immobilisation[]) => immobilisations.map((immo: Immobilisation) => immo.code)),
      map((codesArray: string[]) => [...new Set(codesArray)]),
      takeUntil(this.destroy$)
    ).subscribe(
      (codes: string[]) => {
        this.immobilisationCodes = codes.filter(code => code !== null && code !== undefined && code !== '');
        console.log('Codes d\'immobilisation chargés (pour rapport d\'enregistrement):', this.immobilisationCodes.length, 'codes.');
      },
      (error) => {
        console.error('Erreur lors du chargement des codes d\'immobilisation:', error);
      }
    );
  }

  loadImmobilisationsForFilter(): void {
    console.log('Loading immobilisations for general filter...');
    this.immobilisationsService.getAllImmobilisations().pipe(takeUntil(this.destroy$)).subscribe(
      (data: Immobilisation[]) => {
        this.immobilisations = data;
        console.log('Immobilisations chargées (pour rapports d\'interventions et inventaire):', this.immobilisations.length, 'immobilisations.');
      },
      (error) => {
        console.error('Erreur lors du chargement des immobilisations pour le filtre:', error);
      }
    );
  }

  loadTypeInterventionsForFilter(): void {
    console.log('Loading intervention types...');
    this.TypeInterventionService.getAllTypeInterventions().pipe(takeUntil(this.destroy$)).subscribe(
      (data: TypeIntervention[]) => {
        this.typeInterventions = data;
        console.log('Types d\'intervention chargés (pour rapport d\'interventions):', this.typeInterventions.length, 'types.');
      },
      (error) => {
        console.error('Erreur lors du chargement des types d\'intervention pour le filtre:', error);
      }
    );
  }

      loadInterventions_immo(): void {
    this.interventionService.getAllInterventions_immos().subscribe({
      next: (data) => {
        this.intervention_immo = data; // Stocker la liste des interventions immos
      },
      error: (err) => {
        console.error("Erreur lors du chargement des immobilisations :", err);
      }
    });
  }


  loadRapportImmos(): void {
    console.log('--- Tentative de chargement du rapport ---');
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

    const processDateFilters = (startDateField: string, endDateField: string) => {
      if (filters[startDateField]) {
        filters.date_debut = this.formatDate(filters[startDateField]);
      } else {
        filters.date_debut = null;
      }
      if (filters[endDateField]) {
        filters.date_fin = this.formatDate(filters[endDateField]);
      } else {
        filters.date_fin = null;
      }
      delete filters[startDateField];
      delete filters[endDateField];
    };

    switch (this.selectedReportTypeId) {
      case 'enregistrement':
        if (filters.date_debut_acquisition) {
          filters.date_debut_acquisition = this.formatDate(filters.date_debut_acquisition);
        } else {
          delete filters.date_debut_acquisition;
        }
        if (filters.code_immo === null || filters.code_immo === undefined || filters.code_immo === '') { delete filters.code_immo; }
        this.cleanFiltersForReportType(filters, ['date_debut_mouvement', 'date_fin_mouvement', 'old_bureau_id', 'bureau_id', 'old_employe_id', 'employe_id', 'date_debut_intervention', 'date_fin_intervention', 'type_intervention_id', 'immo_id', 'date_debut_inventaire', 'date_fin_inventaire']);
        break;

      case 'transfert':
        processDateFilters('date_debut_mouvement', 'date_fin_mouvement');
        if (filters.old_bureau_id === null || filters.old_bureau_id === undefined || filters.old_bureau_id === '') { delete filters.old_bureau_id; }
        if (filters.bureau_id === null || filters.bureau_id === undefined || filters.bureau_id === '') { delete filters.bureau_id; }
        if (filters.old_employe_id === null || filters.old_employe_id === undefined || filters.old_employe_id === '') { delete filters.old_employe_id; }
        if (filters.employe_id === null || filters.employe_id === undefined || filters.employe_id === '') { delete filters.employe_id; }
        this.cleanFiltersForReportType(filters, ['code_immo', 'date_debut_acquisition', 'date_debut_intervention', 'date_fin_intervention', 'type_intervention_id', 'immo_id', 'date_debut_inventaire', 'date_fin_inventaire']);
        break;

      case 'intervention':
        processDateFilters('date_debut_intervention', 'date_fin_intervention');
        if (filters.type_intervention_id === null || filters.type_intervention_id === undefined || filters.type_intervention_id === '') { delete filters.type_intervention_id; }
        if (filters.immo_id === null || filters.immo_id === undefined || filters.immo_id === '') { delete filters.immo_id; }
        this.cleanFiltersForReportType(filters, ['code_immo', 'date_debut_acquisition', 'date_debut_mouvement', 'date_fin_mouvement', 'old_bureau_id', 'bureau_id', 'old_employe_id', 'employe_id', 'date_debut_inventaire', 'date_fin_inventaire']);
        break;

      case 'inventaire':
        processDateFilters('date_debut_inventaire', 'date_fin_inventaire');
        this.cleanFiltersForReportType(filters, ['code_immo', 'date_debut_acquisition', 'date_debut_mouvement', 'date_fin_mouvement', 'old_bureau_id', 'bureau_id', 'old_employe_id', 'employe_id', 'date_debut_intervention', 'date_fin_intervention', 'type_intervention_id', 'immo_id']);
        break;
    }

    filters.id_type_rapport = this.selectedReportTypeId;

    console.log('Envoi des filtres au backend:', filters);

    // Utilisation de la nouvelle méthode générique dans le service
    this.rapportService.getRapportData(filters).pipe(takeUntil(this.destroy$)).subscribe(
      (response: BackendPostResource<PaginatedResponse<(Immobilisation | Transfert | Intervention)>>) => {
        console.log('Réponse du backend (brute du service):', response);
        if (response.success && response.data && response.data.data) {
          this.rows = response.data.data;
          this.temp = [...response.data.data];
          console.log('Rapport data loaded successfully. Rows count:', this.rows.length);
          this.errorMessage = '';
        } else {
          this.rows = [];
          this.temp = [];
          this.errorMessage = response.message || "Aucune donnée trouvée ou erreur inattendue de la part du service.";
          console.warn('Rapport data response indicates no success or no data:', this.errorMessage);
        }

        this.loadingIndicator = false;
        this.isGeneratingReport = false;
        if (this.rows.length === 0 && !this.errorMessage) {
          this.errorMessage = "Aucune donnée trouvée pour les critères spécifiés.";
        } else if (this.rows.length > 0) {
          this.errorMessage = '';
        }
        console.log('Données du rapport chargées et affichées:', this.rows);
      },
      (error: any) => {
        console.error('Erreur lors du chargement du rapport:', error);
        this.errorMessage = `Erreur lors du chargement du rapport: ${error.message || 'Veuillez réessayer.'}`;
        this.loadingIndicator = false;
        this.isGeneratingReport = false;
        this.rows = [];
        this.temp = [];
      }
    );
  }

  downloadRapportImmosPDF(): void {
    console.log('--- Tentative d\'impression du rapport PDF ---');
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

    const processDateFiltersPdf = (startDateField: string, endDateField: string) => {
      if (filters[startDateField]) {
        filters.date_debut = this.formatDate(filters[startDateField]);
      } else {
        filters.date_debut = null;
      }
      if (filters[endDateField]) {
        filters.date_fin = this.formatDate(filters[endDateField]);
      } else {
        filters.date_fin = null;
      }
      delete filters[startDateField];
      delete filters[endDateField];
    };

    switch (this.selectedReportTypeId) {
      case 'enregistrement':
        if (filters.date_debut_acquisition) {
          filters.date_debut_acquisition = this.formatDate(filters.date_debut_acquisition);
        } else {
          delete filters.date_debut_acquisition;
        }
        if (filters.code_immo === null || filters.code_immo === undefined || filters.code_immo === '') { delete filters.code_immo; }
        this.cleanFiltersForReportType(filters, ['date_debut_mouvement', 'date_fin_mouvement', 'old_bureau_id', 'bureau_id', 'old_employe_id', 'employe_id', 'date_debut_intervention', 'date_fin_intervention', 'type_intervention_id', 'immo_id', 'date_debut_inventaire', 'date_fin_inventaire']);
        break;

      case 'transfert':
        processDateFiltersPdf('date_debut_mouvement', 'date_fin_mouvement');
        if (filters.old_bureau_id === null || filters.old_bureau_id === undefined || filters.old_bureau_id === '') { delete filters.old_bureau_id; }
        if (filters.bureau_id === null || filters.bureau_id === undefined || filters.bureau_id === '') { delete filters.bureau_id; }
        if (filters.old_employe_id === null || filters.old_employe_id === undefined || filters.old_employe_id === '') { delete filters.old_employe_id; }
        if (filters.employe_id === null || filters.employe_id === undefined || filters.employe_id === '') { delete filters.employe_id; }

        this.cleanFiltersForReportType(filters, ['code_immo', 'date_debut_acquisition', 'date_debut_intervention', 'date_fin_intervention', 'type_intervention_id', 'immo_id', 'date_debut_inventaire', 'date_fin_inventaire']);
        break;

      case 'intervention':
        processDateFiltersPdf('date_debut_intervention', 'date_fin_intervention');
        if (filters.type_intervention_id === null || filters.type_intervention_id === undefined || filters.type_intervention_id === '') { delete filters.type_intervention_id; }
        if (filters.immo_id === null || filters.immo_id === undefined || filters.immo_id === '') { delete filters.immo_id; }

        this.cleanFiltersForReportType(filters, ['code_immo', 'date_debut_acquisition', 'date_debut_mouvement', 'date_fin_mouvement', 'old_bureau_id', 'bureau_id', 'old_employe_id', 'employe_id', 'date_debut_inventaire', 'date_fin_inventaire']);
        break;

      case 'inventaire':
        processDateFiltersPdf('date_debut_inventaire', 'date_fin_inventaire');
        this.cleanFiltersForReportType(filters, ['code_immo', 'date_debut_acquisition', 'date_debut_mouvement', 'date_fin_mouvement', 'old_bureau_id', 'bureau_id', 'old_employe_id', 'employe_id', 'date_debut_intervention', 'date_fin_intervention', 'type_intervention_id', 'immo_id']);
        break;
    }

    filters.id_type_rapport = this.selectedReportTypeId;

    console.log('Envoi des filtres pour PDF au backend:', filters);

    // Utilisation de la nouvelle méthode générique dans le service
    this.rapportService.imprimerRapportData(filters).pipe(takeUntil(this.destroy$)).subscribe(
      (response: Blob) => {
        console.log('Réponse PDF reçue du backend.');
        const fileURL = window.URL.createObjectURL(response);
        const a = document.createElement('a');
        a.href = fileURL;
        a.download = `rapport_${this.selectedReportTypeId || 'immobilisations'}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(fileURL);
        this.isGeneratingReport = false;
        this.errorMessage = '';
      },
      (error: any) => {
        console.error('Erreur lors du téléchargement du PDF du rapport:', error);
        this.errorMessage = `Impossible de télécharger le PDF: ${error.message || 'Veuillez vérifier votre connexion ou contacter l\'administrateur.'}`;
        this.isGeneratingReport = false;
      }
    );
  }

  private cleanFiltersForReportType(filters: { [key: string]: any }, fieldsToRemove: string[]): void {
    fieldsToRemove.forEach(field => {
      delete filters[field];
    });
    console.log('Cleaned filters:', fieldsToRemove);
  }

  formatDate(date: NgbDateStruct): string {
    if (!date) return '';
    const year = date.year;
    const month = date.month.toString().padStart(2, '0');
    const day = date.day.toString().padStart(2, '0');
    console.log(`Formatted date: ${year}-${month}-${day}`);
    return `${year}-${month}-${day}`;
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
    console.log('Form group marked as touched.');
  }

  // La recherche locale s'applique à la vue actuelle (rows), peu importe le type de rapport
  updateFilter(event: KeyboardEvent): void {

    const val = (event.target as HTMLInputElement).value.toLowerCase();
    console.log('Valeur de recherche locale:', val);

    if (this.temp.length > 0) {
      this.rows = this.temp.filter(item => {
        let match = false;

        switch (this.selectedReportTypeId) {
          case 'enregistrement':
            const immoItem = item as Immobilisation;
            match = (immoItem.code?.toLowerCase().includes(val) || false) ||
                    (immoItem.designation?.toLowerCase().includes(val) || false) ||
                    (immoItem.observation?.toLowerCase().includes(val) || false) ||
                    (immoItem.employe?.nom?.toLowerCase().includes(val) || false) ||
                    (immoItem.fournisseur?.nom?.toLowerCase().includes(val) || false) ||
                    (immoItem.groupeTypeImmo?.libelle?.toLowerCase().includes(val) || false) ||
                    (immoItem.sousTypeImmo?.libelle?.toLowerCase().includes(val) || false) ||
                    (immoItem.statusImmo?.libelle_status_immo?.toLowerCase().includes(val) || false);
            break;

          case 'transfert':
            const transfertItem = item as Transfert;
            match = (transfertItem.immobilisation?.code?.toLowerCase().includes(val) || false) ||
                    (transfertItem.immobilisation?.designation?.toLowerCase().includes(val) || false) ||
                    (transfertItem.old_bureau?.libelle_bureau?.toLowerCase().includes(val) || false) ||
                    (transfertItem.bureau?.libelle_bureau?.toLowerCase().includes(val) || false) ||
                    (transfertItem.old_employe?.nom?.toLowerCase().includes(val) || false) ||
                    (transfertItem.employe?.nom?.toLowerCase().includes(val) || false) ||
                    (transfertItem.motif?.toLowerCase().includes(val) || false);
            break;

          case 'intervention':
            const interventionItem = item as Intervention;
            match =
                    (interventionItem.titre?.toLowerCase().includes(val) || false) ||
                    (interventionItem.observation?.toLowerCase().includes(val) || false);
            break;

          case 'inventaire':
            const inventaireItem = item as Immobilisation;
            match = (inventaireItem.code?.toLowerCase().includes(val) || false) ||
                    (inventaireItem.designation?.toLowerCase().includes(val) || false) ||

                    (inventaireItem.observation?.toLowerCase().includes(val) || false) ||
                    (inventaireItem.bureau?.libelle_bureau?.toLowerCase().includes(val) || false) ||
                    (inventaireItem.employe?.nom?.toLowerCase().includes(val) || false) ||
                    (inventaireItem.fournisseur?.nom?.toLowerCase().includes(val) || false) ||
                    (inventaireItem.groupeTypeImmo?.libelle?.toLowerCase().includes(val) || false) ||
                    (inventaireItem.sousTypeImmo?.libelle?.toLowerCase().includes(val) || false) ||
                    (inventaireItem.statusImmo?.libelle_status_immo?.toLowerCase().includes(val) || false);
            break;
        }
        return match;
      });
      console.log('Filtered rows count:', this.rows.length);
    } else {
      this.rows = [];
      console.log('No temporary data to filter. Rows set to empty.');
    }

    if (this.table) {
      this.table.offset = 0;
      console.log('Datatable offset reset.');
    }
  }

}
