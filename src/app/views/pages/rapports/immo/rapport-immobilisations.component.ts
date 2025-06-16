// src/app/views/pages/rapport/immobilisations/rapport-immobilisations.component.ts
import { Component, ViewChild, OnInit, OnDestroy, inject } from '@angular/core';
import { FormGroup, FormBuilder, Validators, AbstractControl, ValidatorFn } from '@angular/forms'; // Ajout de ValidatorFn
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

// Interfaces
import {
  Immobilisation, Bureau, Employe, Fournisseur,
  GroupeTypeImmo, SousTypeImmo, StatusImmo, Vehicule, PaginatedResponse, Transfert
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
  templateUrl: './rapport-immobilisations.component.html',
  styleUrls: []
})
export class RapportImmobilisationsComponent implements OnInit, OnDestroy {
  @ViewChild('table') table!: DatatableComponent;

  rapportForm!: FormGroup;
  // CORRECTION: Utilisation du type union pour les tableaux
  rows: (Immobilisation | Transfert)[] = [];
  temp: (Immobilisation | Transfert)[] = [];
  loadingIndicator = false;
  ColumnMode = ColumnMode;

  // Listes pour les dropdowns de filtrage (toujours chargées si potentiellement utilisées)
  bureaux: Bureau[] = [];
  employes: Employe[] = [];
  fournisseurs: Fournisseur[] = [];
  groupeTypesImmo: GroupeTypeImmo[] = [];
  sousTypesImmo: SousTypeImmo[] = [];
  statusImmos: StatusImmo[] = [];
  vehicules: Vehicule[] = [];
  immobilisationCodes: string[] = []; // Pour le rapport d'enregistrement

  // NOUVEAU: Types de rapports
  typeRapportsImmo: TypeRapportImmo[] = [
    { id: 'enregistrement', libelle: 'Rapport d\'Enregistrement des Immobilisations' },
    { id: 'transfert', libelle: 'Rapport des Transferts d\'Immobilisations' }, // NOUVEAU TYPE
  ];
  selectedReportTypeId: string | null = null; // ID du type de rapport sélectionné

  // Indicateurs pour l'affichage conditionnel des filtres
  showRegistrationFilters: boolean = false;
  showTransferFilters: boolean = false; // NOUVEAU

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
    private immobilisationsService: ImmobilisationsService, // Pour les codes immo
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.loadFilterData();
    this.loadImmobilisationCodes(); // Toujours charger si le rapport d'enregistrement existe
    // Écouter les changements sur le type de rapport pour adapter le formulaire
    this.rapportForm.get('id_type_rapport')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(typeRapportId => {
      this.onTypeRapportChange(typeRapportId);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // CORRECTION: La fonction de validation doit être une fabrique de ValidatorFn
  dateRangeValidatorForTransfer(): ValidatorFn {
    return (group: AbstractControl): { [key: string]: any } | null => {
      // Cast le AbstractControl en FormGroup car ce validateur est au niveau du groupe
      const formGroup = group as FormGroup;
      const startDateControl = formGroup.get('date_debut_mouvement');
      const endDateControl = formGroup.get('date_fin_mouvement');

      const startDate = startDateControl?.value as NgbDateStruct;
      const endDate = endDateControl?.value as NgbDateStruct;

      // Logique de validation des dates
      if (startDateControl?.hasValidator(Validators.required) && endDateControl?.hasValidator(Validators.required)) {
        if (!startDate && endDate) {
          // L'erreur 'required' sera déjà gérée par le validateur de contrôle
          return { 'dateRangeMissingStartDate': true };
        }
        if (startDate && !endDate) {
          return { 'dateRangeMissingEndDate': true };
        }
      }
      
      // Si les deux dates sont renseignées, vérifier l'ordre
      if (startDate && endDate) {
        const sDate = new Date(startDate.year, startDate.month - 1, startDate.day);
        const eDate = new Date(endDate.year, endDate.month - 1, endDate.day);

        if (sDate > eDate) {
          return { 'dateRangeInvalidOrder': true };
        }
      }

      return null; // Validation réussie
    };
  }

  initForm(): void {
    this.rapportForm = this.fb.group({
      id_type_rapport: [null, Validators.required],

      // Champs pour le rapport d'enregistrement (désactivés par défaut)
      code_immo: [{ value: null, disabled: true }],
      date_debut_acquisition: [{ value: null, disabled: true }],

      // NOUVEAUX Champs pour le rapport de transfert (désactivés par défaut)
      date_debut_mouvement: [{ value: null, disabled: true }],
      date_fin_mouvement: [{ value: null, disabled: true }],
      old_bureau_id: [{ value: null, disabled: true }],
      bureau_id: [{ value: null, disabled: true }],
      old_employe_id: [{ value: null, disabled: true }],
      employe_id: [{ value: null, disabled: true }],
    });
  }

  onTypeRapportChange(typeRapportId: string | null): void {
    this.selectedReportTypeId = typeRapportId;
    this.resetFormControls(); // Réinitialiser tous les contrôles et validateurs

    switch (typeRapportId) {
      case 'enregistrement':
        this.showRegistrationFilters = true;
        this.showTransferFilters = false;
        // Activation des champs pour l'enregistrement (date_debut_acquisition optionnelle)
        this.enableAndSetValidators(['code_immo', 'date_debut_acquisition'], this.rapportForm);
        this.rapportForm.get('date_debut_acquisition')?.clearValidators(); // Rendre la date optionnelle
        this.rapportForm.get('date_debut_acquisition')?.updateValueAndValidity();
        // S'assurer qu'aucun validateur de groupe de transfert n'est appliqué
        this.rapportForm.clearValidators();
        break;

      case 'transfert': // NOUVEAU CAS POUR LES TRANSFERTS
        this.showRegistrationFilters = false;
        this.showTransferFilters = true;
        // Activation des champs pour les transferts (dates de mouvement OBLIGATOIRES)
        this.enableAndSetValidators([
          'date_debut_mouvement', 'date_fin_mouvement',
          'old_bureau_id', 'bureau_id',
          'old_employe_id', 'employe_id'
        ], this.rapportForm);
        
        // Les dates de mouvement sont OBLIGATOIRES pour les transferts
        this.rapportForm.get('date_debut_mouvement')?.setValidators(Validators.required);
        this.rapportForm.get('date_fin_mouvement')?.setValidators(Validators.required);
        
        // CORRECTION: Appliquer le validateur de plage de date au FORMGROUP en appelant la fabrique
        this.rapportForm.setValidators(this.dateRangeValidatorForTransfer()); 
        
        this.rapportForm.get('date_debut_mouvement')?.updateValueAndValidity();
        this.rapportForm.get('date_fin_mouvement')?.updateValueAndValidity();
        break;

      default:
        this.showRegistrationFilters = false;
        this.showTransferFilters = false;
        this.rapportForm.reset({ id_type_rapport: typeRapportId });
        this.markFormGroupTouched(this.rapportForm);
        // Toujours effacer les validateurs de groupe si aucun rapport spécifique n'est choisi
        this.rapportForm.clearValidators();
        break;
    }
    this.rapportForm.updateValueAndValidity(); // Mettre à jour la validation globale du formulaire
    this.errorMessage = '';
    this.rows = [];
    this.temp = [];
  }

  private enableAndSetValidators(controlNames: string[], formGroup: FormGroup): void {
    controlNames.forEach(name => {
      const control = formGroup.get(name);
      if (control) {
        control.enable();
      }
    });
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
    this.showRegistrationFilters = false;
    this.showTransferFilters = false;
    this.rapportForm.clearValidators(); // Important : Supprimer les validateurs de groupe précédents
    this.rapportForm.updateValueAndValidity();
  }

  loadFilterData(): void {
    // Tous ces services chargent les données nécessaires pour les ng-select
    this.bureauxService.getAllBureaux().pipe(takeUntil(this.destroy$)).subscribe((data: Bureau[]) => this.bureaux = data);
    this.employesService.getAllEmployes().pipe(takeUntil(this.destroy$)).subscribe((data: Employe[]) => this.employes = data);
    this.fournisseursService.getAllFournisseurs().pipe(takeUntil(this.destroy$)).subscribe((data: Fournisseur[]) => this.fournisseurs = data);
    this.groupeTypeImmoService.getAllGroupeTypeImmos().pipe(takeUntil(this.destroy$)).subscribe((data: GroupeTypeImmo[]) => this.groupeTypesImmo = data);
    this.sousTypeImmoService.getAllSousTypeImmos().pipe(takeUntil(this.destroy$)).subscribe((data: SousTypeImmo[]) => this.sousTypesImmo = data);
    this.statusImmoService.getAllStatusImmos().pipe(takeUntil(this.destroy$)).subscribe((data: StatusImmo[]) => this.statusImmos = data);
    this.vehiculeService.getAllVehicules().pipe(takeUntil(this.destroy$)).subscribe((data: Vehicule[]) => this.vehicules = data);
  }

  loadImmobilisationCodes(): void {
    this.immobilisationsService.getAllImmobilisations().pipe(
      map((immobilisations: Immobilisation[]) => immobilisations.map((immo: Immobilisation) => immo.code)),
      map((codesArray: string[]) => [...new Set(codesArray)]),
      takeUntil(this.destroy$)
    ).subscribe(
      (codes: string[]) => {
        this.immobilisationCodes = codes.filter(code => code !== null && code !== undefined && code !== '');
        console.log('Codes d\'immobilisation chargés:', this.immobilisationCodes);
      },
      (error) => {
        console.error('Erreur lors du chargement des codes d\'immobilisation:', error);
      }
    );
  }

  loadRapportImmos(): void {
    console.log('--- Tentative de chargement du rapport ---');
    console.log('Form isValid before API call:', this.rapportForm.valid);
    console.log('Form errors (group level):', this.rapportForm.errors); // Erreurs du groupe (ex: dateRangeInvalidOrder)
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

    // Nettoyage et formatage des filtres avant envoi en fonction du type de rapport
    if (this.selectedReportTypeId === 'enregistrement') {
      filters.date_debut_acquisition = filters.date_debut_acquisition ? this.formatDate(filters.date_debut_acquisition) : null;
      // Supprimer le code_immo s'il est null/vide (il est optionnel)
      if (filters.code_immo === null || filters.code_immo === undefined || filters.code_immo === '') {
          delete filters.code_immo;
      }
      // Supprimer date_debut_acquisition si elle est null
      if (filters.date_debut_acquisition === null) {
          delete filters.date_debut_acquisition;
      }
      // Supprimer les champs de transfert qui pourraient être restés
      delete filters.date_debut_mouvement;
      delete filters.date_fin_mouvement;
      delete filters.old_bureau_id;
      delete filters.bureau_id;
      delete filters.old_employe_id;
      delete filters.employe_id;

    } else if (this.selectedReportTypeId === 'transfert') {
      // Pour les transferts, les dates sont OBLIGATOIRES (validation frontend),
      // donc on peut supposer qu'elles sont présentes si le formulaire est valide.
      filters.date_debut = filters.date_debut_mouvement ? this.formatDate(filters.date_debut_mouvement) : null;
      filters.date_fin = filters.date_fin_mouvement ? this.formatDate(filters.date_fin_mouvement) : null;
      
      // Supprimer les noms locaux des contrôles de date
      delete filters.date_debut_mouvement;
      delete filters.date_fin_mouvement;

      // Nettoyage des IDs d'employés/bureaux si null/vides (ils sont optionnels)
      if (filters.old_bureau_id === null || filters.old_bureau_id === undefined || filters.old_bureau_id === '') { delete filters.old_bureau_id; }
      if (filters.bureau_id === null || filters.bureau_id === undefined || filters.bureau_id === '') { delete filters.bureau_id; }
      if (filters.old_employe_id === null || filters.old_employe_id === undefined || filters.old_employe_id === '') { delete filters.old_employe_id; }
      if (filters.employe_id === null || filters.employe_id === undefined || filters.employe_id === '') { delete filters.employe_id; }

      // Supprimer les champs d'enregistrement qui pourraient être restés
      delete filters.code_immo;
      delete filters.date_debut_acquisition;
    }

    // Cette boucle nettoie les champs désactivés (qui ne sont pas pertinents pour le type de rapport sélectionné)
    // Elle est généralement redondante si la logique ci-dessus est bien faite, mais peut servir de filet de sécurité.
    Object.keys(this.rapportForm.controls).forEach(key => {
      if (this.rapportForm.get(key)?.disabled && (filters[key] === null || filters[key] === undefined || filters[key] === '')) {
        delete filters[key];
      }
    });

    console.log('Envoi des filtres au backend:', filters);

    // Utilisation de la nouvelle méthode générique dans le service
    this.rapportService.getRapportData(filters).pipe(takeUntil(this.destroy$)).subscribe(
      (response: BackendPostResource<PaginatedResponse<(Immobilisation | Transfert)>>) => { // Type de réponse corrigé
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

    // Nettoyage et formatage des filtres avant envoi en fonction du type de rapport
    if (this.selectedReportTypeId === 'enregistrement') {
      filters.date_debut_acquisition = filters.date_debut_acquisition ? this.formatDate(filters.date_debut_acquisition) : null;
      if (filters.code_immo === null || filters.code_immo === undefined || filters.code_immo === '') {
          delete filters.code_immo;
      }
      if (filters.date_debut_acquisition === null) {
          delete filters.date_debut_acquisition;
      }
      // Supprimer les champs de transfert qui pourraient être restés
      delete filters.date_debut_mouvement;
      delete filters.date_fin_mouvement;
      delete filters.old_bureau_id;
      delete filters.bureau_id;
      delete filters.old_employe_id;
      delete filters.employe_id;

    } else if (this.selectedReportTypeId === 'transfert') {
      filters.date_debut = filters.date_debut_mouvement ? this.formatDate(filters.date_debut_mouvement) : null;
      filters.date_fin = filters.date_fin_mouvement ? this.formatDate(filters.date_fin_mouvement) : null;

      delete filters.date_debut_mouvement;
      delete filters.date_fin_mouvement;

      if (filters.old_bureau_id === null || filters.old_bureau_id === undefined || filters.old_bureau_id === '') { delete filters.old_bureau_id; }
      if (filters.bureau_id === null || filters.bureau_id === undefined || filters.bureau_id === '') { delete filters.bureau_id; }
      if (filters.old_employe_id === null || filters.old_employe_id === undefined || filters.old_employe_id === '') { delete filters.old_employe_id; }
      if (filters.employe_id === null || filters.employe_id === undefined || filters.employe_id === '') { delete filters.employe_id; }
      
      // Supprimer les champs d'enregistrement qui pourraient être restés
      delete filters.code_immo;
      delete filters.date_debut_acquisition;
    }
    
    Object.keys(this.rapportForm.controls).forEach(key => {
      if (this.rapportForm.get(key)?.disabled && (filters[key] === null || filters[key] === undefined || filters[key] === '')) {
        delete filters[key];
      }
    });

    console.log('Envoi des filtres pour PDF au backend:', filters);

    // Utilisation de la nouvelle méthode générique dans le service
    this.rapportService.imprimerRapportData(filters).pipe(takeUntil(this.destroy$)).subscribe(
      (response: Blob) => {
        console.log('Réponse PDF reçue du backend.');
        const fileURL = window.URL.createObjectURL(response);
        const a = document.createElement('a');
        a.href = fileURL;
        a.download = `rapport_${this.selectedReportTypeId || 'immobilisations'}.pdf`; // Nom de fichier dynamique
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(fileURL);
        this.isGeneratingReport = false;
      },
      (error: any) => {
        console.error('Erreur lors du téléchargement du PDF du rapport:', error);
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

  // La recherche locale s'applique à la vue actuelle (rows), peu importe le type de rapport
  updateFilter(event: KeyboardEvent): void {
    const val = (event.target as HTMLInputElement).value.toLowerCase();
    console.log('Valeur de recherche locale:', val);

    if (this.temp.length > 0) {
        this.rows = this.temp.filter(item => {
            let match = false;

            if (this.selectedReportTypeId === 'enregistrement') {
                const immoItem = item as Immobilisation; // Cast pour aider TypeScript et accéder aux propriétés
                match = (immoItem.code?.toLowerCase().includes(val) || false) ||
                        (immoItem.designation?.toLowerCase().includes(val) || false) ||
                        (immoItem.observation?.toLowerCase().includes(val) || false) ||
                        (immoItem.employe?.nom?.toLowerCase().includes(val) || false) ||
                        (immoItem.employe?.nom?.toLowerCase().includes(val) || false) ||
                        (immoItem.fournisseur?.nom?.toLowerCase().includes(val) || false) ||
                        (immoItem.groupeTypeImmo?.libelle?.toLowerCase().includes(val) || false) ||
                        (immoItem.sousTypeImmo?.libelle?.toLowerCase().includes(val) || false) ||
                        (immoItem.statusImmo?.libelle_status_immo?.toLowerCase().includes(val) || false)
                        ;
            } else if (this.selectedReportTypeId === 'transfert') {
                const transfertItem = item as Transfert; // Cast pour aider TypeScript
                match = (transfertItem.immobilisation?.code?.toLowerCase().includes(val) || false) ||
                        (transfertItem.immobilisation?.designation?.toLowerCase().includes(val) || false) ||
                        (transfertItem.old_bureau?.libelle_bureau?.toLowerCase().includes(val) || false) ||
                        (transfertItem.bureau?.libelle_bureau?.toLowerCase().includes(val) || false) ||
                        (transfertItem.old_employe?.nom?.toLowerCase().includes(val) || false) ||
                        (transfertItem.old_employe?.nom?.toLowerCase().includes(val) || false) ||
                        (transfertItem.employe?.nom?.toLowerCase().includes(val) || false) ||
                        (transfertItem.employe?.nom?.toLowerCase().includes(val) || false) ||
                        (transfertItem.motif?.toLowerCase().includes(val) || false); // Ajout du motif si pertinent
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
