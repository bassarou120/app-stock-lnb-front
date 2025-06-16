// src/app/views/pages/rapport/immobilisations/rapport-immobilisations.component.ts
import { Component, ViewChild, OnInit, OnDestroy, inject } from '@angular/core';
import { FormGroup, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { ColumnMode, DatatableComponent, NgxDatatableModule } from '@siemens/ngx-datatable';
import { NgbDateStruct, NgbCalendar } from '@ng-bootstrap/ng-bootstrap';
import { CommonModule, DatePipe } from '@angular/common';
import { NgSelectModule } from '@ng-select/ng-select';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { NgbAlertModule, NgbDropdownModule, NgbDatepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { FeatherIconDirective } from '../../../../core/feather-icon/feather-icon.directive';

// Services pour les dropdowns du formulaire de filtre
import { ImmobilisationRapportService, BackendPostResource } from '../../../../core/services/rapport/immobilisation-rapport.service';
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
  GroupeTypeImmo, SousTypeImmo, StatusImmo, Vehicule, PaginatedResponse
} from '../../../../core/services/interface/models';
import { Subject, takeUntil } from 'rxjs';
import { map, distinct } from 'rxjs/operators';

// Définir les types de rapport pour les immobilisations
interface TypeRapportImmo {
  id: string;
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
  rows: Immobilisation[] = [];
  temp: Immobilisation[] = [];
  loadingIndicator = false;
  ColumnMode = ColumnMode;

  bureaux: Bureau[] = [];
  employes: Employe[] = [];
  fournisseurs: Fournisseur[] = [];
  groupeTypesImmo: GroupeTypeImmo[] = [];
  sousTypesImmo: SousTypeImmo[] = [];
  statusImmos: StatusImmo[] = [];
  vehicules: Vehicule[] = [];
  immobilisationCodes: string[] = [];

  typeRapportsImmo: TypeRapportImmo[] = [
    { id: 'enregistrement', libelle: 'Rapport d\'Enregistrement des Immobilisations' },
    { id: 'transfert', libelle: 'Rapport de transfert des Immobilisations' },
  ];
  selectedReportTypeId: string | null = null;

  showCommonFilters: boolean = false;
  showRegistrationFilters: boolean = false;

  errorMessage: string = '';
  isGeneratingReport = false;
  currentDate: NgbDateStruct = inject(NgbCalendar).getToday();
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private rapportService: ImmobilisationRapportService,
    private bureauxService: BureauxService,
    private employesService: EmployesService,
    private fournisseursService: FournisseursService,
    private groupeTypeImmoService: GroupeTypeImmoService,
    private sousTypeImmoService: SousTypeImmoService,
    private statusImmoService: StatusImmoService,
    private vehiculeService: VehiculeService,
    private immobilisationsService: ImmobilisationsService,
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.loadFilterData();
    this.loadImmobilisationCodes();
    this.rapportForm.get('id_type_rapport')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(typeRapportId => {
      this.onTypeRapportChange(typeRapportId);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  initForm(): void {
    this.rapportForm = this.fb.group({
      id_type_rapport: [null, Validators.required],
      code_immo: [{ value: null, disabled: true }], // Sera un ng-select, optionnel
      date_debut_acquisition: [{ value: null, disabled: true }], // Date de création, OPTIONNELLE maintenant
    });
  }

  onTypeRapportChange(typeRapportId: string | null): void {
    this.selectedReportTypeId = typeRapportId;
    this.resetFormControls();

    switch (typeRapportId) {
      case 'enregistrement':
        this.showRegistrationFilters = true;
        // Active seulement le code et la date de début d'acquisition. La date de début est maintenant optionnelle.
        this.enableAndSetValidators(['code_immo', 'date_debut_acquisition'], this.rapportForm);
        // Supprime le validateur 'required' pour la date de début
        this.rapportForm.get('date_debut_acquisition')?.clearValidators();
        this.rapportForm.get('date_debut_acquisition')?.updateValueAndValidity();
        break;
      default:
        this.showRegistrationFilters = false;
        this.rapportForm.reset({ id_type_rapport: typeRapportId });
        this.markFormGroupTouched(this.rapportForm);
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
  }

  loadFilterData(): void {
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
    console.log('Form errors:', this.rapportForm.errors);
    if (this.rapportForm.get('date_debut_acquisition')?.errors) {
      console.log('Errors on date_debut_acquisition:', this.rapportForm.get('date_debut_acquisition')?.errors);
    }

    if (this.rapportForm.invalid) {
      this.errorMessage = "Veuillez sélectionner un type de rapport.";
      this.markFormGroupTouched(this.rapportForm);
      console.warn('Formulaire invalide, requête non envoyée.');
      return;
    }

    this.isGeneratingReport = true;
    this.loadingIndicator = true;
    this.errorMessage = '';

    const filters = { ...this.rapportForm.value };

    
    const formattedDateDebutAcquisition = filters.date_debut_acquisition ? this.formatDate(filters.date_debut_acquisition) : null;
    
    // Supprimer explicitement le champ date_fin_acquisition car il n'est plus utilisé
    delete filters.date_fin_acquisition;

    // Assurez-vous que date_debut_acquisition est seulement ajouté si elle a une valeur formatée non-null
    if (formattedDateDebutAcquisition) {
      filters.date_debut_acquisition = formattedDateDebutAcquisition;
    } else {
      delete filters.date_debut_acquisition; // Supprime la clé si la date est null/vide
    }

    // Cette boucle est importante pour nettoyer les filtres qui sont 'disabled' et vides,
    // afin qu'ils ne soient pas envoyés au backend.
    Object.keys(this.rapportForm.controls).forEach(key => {
      
      if (this.rapportForm.get(key)?.disabled && (filters[key] === null || filters[key] === undefined || filters[key] === '')) {
        delete filters[key];
      }
    });

    // Si le code_immo est null ou vide, le supprimer des filtres aussi
    if (filters.code_immo === null || filters.code_immo === undefined || filters.code_immo === '') {
        delete filters.code_immo;
    }

    if (filters.id_type_rapport === 'enregistrement' && !filters.code_immo && !filters.date_debut_acquisition) {
      console.log('Aucun filtre spécifique (code ou date) n\'est appliqué. Chargement de toutes les immobilisations d\'enregistrement.');
     
    }


    console.log('Envoi des filtres au backend:', filters);

    this.rapportService.getImmobilisationsForReport(filters).pipe(takeUntil(this.destroy$)).subscribe(
      (response: BackendPostResource<PaginatedResponse<Immobilisation>>) => {
        console.log('Réponse du backend (brute du service):', response);
        if (response.success && response.data && response.data.data) {
          this.rows = response.data.data;
          this.temp = [...response.data.data];
        } else {
          this.rows = [];
          this.temp = [];
          this.errorMessage = response.message || "Aucune immobilisation trouvée ou erreur inattendue.";
        }
        
        this.loadingIndicator = false;
        this.isGeneratingReport = false;
        if (this.rows.length === 0 && !this.errorMessage) {
          this.errorMessage = "Aucune immobilisation trouvée pour les critères spécifiés.";
        } else if (this.rows.length > 0) {
          this.errorMessage = '';
        }
        console.log('Données du rapport chargées et affichées:', this.rows);
      },
      (error: any) => {
        console.error('Erreur lors du chargement du rapport d\'immobilisations:', error);
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
    if (this.rapportForm.get('date_debut_acquisition')?.errors) {
      console.log('Errors on date_debut_acquisition (PDF):', this.rapportForm.get('date_debut_acquisition')?.errors);
    }

    if (this.rapportForm.invalid) {
      this.errorMessage = "Veuillez sélectionner un type de rapport.";
      this.markFormGroupTouched(this.rapportForm);
      console.warn('Formulaire invalide, impression PDF non lancée.');
      return;
    }

    this.isGeneratingReport = true;
    this.errorMessage = '';

    const filters = { ...this.rapportForm.value };

    const formattedDateDebutAcquisition = filters.date_debut_acquisition ? this.formatDate(filters.date_debut_acquisition) : null;
    delete filters.date_fin_acquisition;
    
    if (formattedDateDebutAcquisition) {
      filters.date_debut_acquisition = formattedDateDebutAcquisition;
    } else {
      delete filters.date_debut_acquisition;
    }

    Object.keys(this.rapportForm.controls).forEach(key => {
      if (this.rapportForm.get(key)?.disabled && (filters[key] === null || filters[key] === undefined || filters[key] === '')) {
        delete filters[key];
      }
    });

    if (filters.code_immo === null || filters.code_immo === undefined || filters.code_immo === '') {
      delete filters.code_immo;
    }

    console.log('Envoi des filtres pour PDF au backend:', filters);

    this.rapportService.imprimerRapportImmos(filters).pipe(takeUntil(this.destroy$)).subscribe(
      (response: Blob) => {
        console.log('Réponse PDF reçue du backend.');
        const fileURL = window.URL.createObjectURL(response);
        const a = document.createElement('a');
        a.href = fileURL;
        a.download = 'rapport_immobilisations.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(fileURL);
        this.isGeneratingReport = false;
      },
      (error: any) => {
        console.error('Erreur lors du téléchargement du PDF du rapport d\'immobilisations:', error);
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
            const codeMatch = item.code?.toLowerCase().includes(val) || false;
            const designationMatch = item.designation?.toLowerCase().includes(val) || false;
            const observationMatch = item.observation?.toLowerCase().includes(val) || false;
            const employeNomMatch = item.employe?.nom?.toLowerCase().includes(val) || false;
            const employePrenomMatch = item.employe?.nom?.toLowerCase().includes(val) || false;
            const fournisseurNomMatch = item.fournisseur?.nom?.toLowerCase().includes(val) || false;
            const groupeTypeImmoMatch = item.groupeTypeImmo?.libelle?.toLowerCase().includes(val) || false;
            const sousTypeImmoMatch = item.sousTypeImmo?.libelle?.toLowerCase().includes(val) || false;
            const statusImmoMatch = item.statusImmo?.libelle_status_immo?.toLowerCase().includes(val) || false;

            return codeMatch || designationMatch || observationMatch || employeNomMatch ||
                   employePrenomMatch || fournisseurNomMatch || groupeTypeImmoMatch ||
                   sousTypeImmoMatch || statusImmoMatch;
        });
    } else {
        this.rows = [];
    }

    if (this.table) {
      this.table.offset = 0;
    }
  }

}
