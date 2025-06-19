// src/app/views/pages/rapports/ticket/rapport-ticket.component.ts
import { Component, ViewChild, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { FormGroup, FormBuilder, Validators, AbstractControl, ValidatorFn } from '@angular/forms';
import { ColumnMode, DatatableComponent, NgxDatatableModule } from '@siemens/ngx-datatable';
import { NgbDateStruct, NgbCalendar, NgbDatepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { CommonModule, DatePipe } from '@angular/common';
import { NgSelectModule } from '@ng-select/ng-select';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { NgbAlertModule, NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { FeatherIconDirective } from '../../../../core/feather-icon/feather-icon.directive';

// Services
import { TicketRapportService, BackendPostResource } from '../../../../core/services/rapport/ticket-rapport.service';
import { CouponTicketService } from '../../../../core/services/coupon-tickets/coupon-tickets.service'; // Assurez-vous que ce service existe
import { CompagniePetroliereService } from '../../../../core/services/compagnie-petroliere/compagnie-petroliere.service'; // Assurez-vous que ce service existe
import { EmployesService } from '../../../../core/services/employes/employes.service'; // Pour les sorties
import { VehiculeService } from '../../../../core/services/vehicules/vehicules.service'; // Pour les sorties
// import { DepartService } from '../../../../core/services/depart/depart.service'; // Assurez-vous que ce service existe
// import { ArriverService } from '../../../../core/services/arriver/arriver.service'; // Assurez-vous que ce service existe

// Interfaces
import {
  MouvementTicket, RetourTicket, AnnulationTicket, CouponTicket, CompagniePetroliere, Employe, Vehicule, PaginatedResponse
} from '../../../../core/services/interface/models';

import { Subject, takeUntil } from 'rxjs';

// Définir les types de rapport pour les tickets
interface TypeRapportTicket {
  id: string; // 'entree ticket', 'sortie ticket', 'retour ticket', 'annulation ticket'
  libelle: string;
}

@Component({
  selector: 'app-rapport-ticket',
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
  templateUrl: './rapport-ticket.component.html',
  styleUrls: []
})
export class RapportTicketComponent implements OnInit, OnDestroy {
  @ViewChild('table') table!: DatatableComponent;

  rapportForm!: FormGroup;
  rows: (MouvementTicket | RetourTicket | AnnulationTicket)[] = [];
  temp: (MouvementTicket | RetourTicket | AnnulationTicket)[] = [];
  loadingIndicator = false;
  ColumnMode = ColumnMode;

  // Listes pour les dropdowns de filtrage
  couponTicketsList: CouponTicket[] = [];
  compagniesList: CompagniePetroliere[] = [];
  employesList: Employe[] = [];
  vehiculesList: Vehicule[] = [];
//   departsList: Depart[] = [];
//   arriversList: Arriver[] = [];

  // Types de rapports de tickets
  typeRapportsTicket: TypeRapportTicket[] = [
    { id: 'entree ticket', libelle: 'Rapport d\'Entrée de Tickets' },
    { id: 'sortie ticket', libelle: 'Rapport de Sortie de Tickets' },
    { id: 'retour ticket', libelle: 'Rapport de Retour de Tickets' },
    { id: 'annulation ticket', libelle: 'Rapport d\'Annulation de Tickets' },
  ];
  selectedReportTypeId: string | null = null; // ID du type de rapport sélectionné

  // Indicateurs pour l'affichage conditionnel des filtres
  showEntreeTicketFilters: boolean = false;
  showSortieTicketFilters: boolean = false;
  showRetourTicketFilters: boolean = false;
  showAnnulationTicketFilters: boolean = false;

  errorMessage: string = '';
  isGeneratingReport = false;
  currentDate: NgbDateStruct = inject(NgbCalendar).getToday();
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private ticketRapportService: TicketRapportService,
    private couponTicketService: CouponTicketService,
    private compagnieService: CompagniePetroliereService,
    private employesService: EmployesService,
    private vehiculeService: VehiculeService,
    private cd: ChangeDetectorRef, // Inject ChangeDetectorRef
    // private departService: DepartService,
    // private arriverService: ArriverService,
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

      // Filtres pour Entrée Ticket
      date_debut_entree_t: [{value: null, disabled: true}],
      date_fin_entree_t: [{value: null, disabled: true}],
      coupon_ticket_id_entree: [{value: null, disabled: true}],
      compagnie_id_entree: [{value: null, disabled: true}],

      // Filtres pour Sortie Ticket
      date_debut_sortie_t: [{value: null, disabled: true}],
      date_fin_sortie_t: [{value: null, disabled: true}],
      coupon_ticket_id_sortie: [{value: null, disabled: true}],
      compagnie_id_sortie: [{value: null, disabled: true}],
      employe_id_sortie: [{value: null, disabled: true}],
      vehicule_id_sortie: [{value: null, disabled: true}],
      depart_id_sortie: [{value: null, disabled: true}],
      arriver_id_sortie: [{value: null, disabled: true}],

      // Filtres pour Retour Ticket
      date_debut_retour_t: [{value: null, disabled: true}],
      date_fin_retour_t: [{value: null, disabled: true}],
      coupon_id_retour: [{value: null, disabled: true}],
      compagnie_id_retour: [{value: null, disabled: true}],
      // Filtres pour Annulation Ticket
      date_debut_annulation_t: [{value: null, disabled: true}],
      date_fin_annulation_t: [{value: null, disabled: true}],
      coupon_id_annulation: [{value: null, disabled: true}],
      compagnie_id_annulation: [{value: null, disabled: true}],
    });
  }

  onTypeRapportChange(typeRapportId: string | null): void {
    this.selectedReportTypeId = typeRapportId;
    this.resetFormControls(); // Réinitialise et désactive tous les champs

    // Réactive le sélecteur de type de rapport (il ne doit jamais être désactivé)
    this.rapportForm.get('id_type_rapport')?.setValidators(Validators.required);
    this.rapportForm.get('id_type_rapport')?.enable({ emitEvent: false });
    this.rapportForm.clearValidators(); // Efface les validateurs de niveau FormGroup pour éviter les conflits initiaux

    switch (typeRapportId) {
      case 'entree ticket':
        this.showEntreeTicketFilters = true;
        this.rapportForm.get('date_debut_entree_t')?.enable();
        this.rapportForm.get('date_fin_entree_t')?.enable();
        this.rapportForm.get('coupon_ticket_id_entree')?.enable();
        this.rapportForm.get('compagnie_id_entree')?.enable();

        // Dates obligatoires pour l'entrée
        this.rapportForm.get('date_debut_entree_t')?.setValidators(Validators.required);
        this.rapportForm.get('date_fin_entree_t')?.setValidators(Validators.required);
        this.rapportForm.setValidators(this.dateRangeValidatorForReport('date_debut_entree_t', 'date_fin_entree_t'));
        break;

      case 'sortie ticket':
        this.showSortieTicketFilters = true;
        this.rapportForm.get('date_debut_sortie_t')?.enable();
        this.rapportForm.get('date_fin_sortie_t')?.enable();
        this.rapportForm.get('coupon_ticket_id_sortie')?.enable();
        this.rapportForm.get('compagnie_id_sortie')?.enable();
        this.rapportForm.get('employe_id_sortie')?.enable();
        this.rapportForm.get('vehicule_id_sortie')?.enable();
        this.rapportForm.get('depart_id_sortie')?.enable();
        this.rapportForm.get('arriver_id_sortie')?.enable();

        // Dates obligatoires pour la sortie
        this.rapportForm.get('date_debut_sortie_t')?.setValidators(Validators.required);
        this.rapportForm.get('date_fin_sortie_t')?.setValidators(Validators.required);
        this.rapportForm.setValidators(this.dateRangeValidatorForReport('date_debut_sortie_t', 'date_fin_sortie_t'));
        break;

      case 'retour ticket':
        this.showRetourTicketFilters = true;
        this.rapportForm.get('date_debut_retour_t')?.enable();
        this.rapportForm.get('date_fin_retour_t')?.enable();
        this.rapportForm.get('coupon_id_retour')?.enable();
        this.rapportForm.get('compagnie_id_retour')?.enable();

        // Dates obligatoires pour le retour
        this.rapportForm.get('date_debut_retour_t')?.setValidators(Validators.required);
        this.rapportForm.get('date_fin_retour_t')?.setValidators(Validators.required);
        this.rapportForm.setValidators(this.dateRangeValidatorForReport('date_debut_retour_t', 'date_fin_retour_t'));
        break;

      case 'annulation ticket':
        this.showAnnulationTicketFilters = true;
        this.rapportForm.get('date_debut_annulation_t')?.enable();
        this.rapportForm.get('date_fin_annulation_t')?.enable();
        this.rapportForm.get('coupon_id_annulation')?.enable();
        this.rapportForm.get('compagnie_id_annulation')?.enable();

        // Dates obligatoires pour l'annulation
        this.rapportForm.get('date_debut_annulation_t')?.setValidators(Validators.required);
        this.rapportForm.get('date_fin_annulation_t')?.setValidators(Validators.required);
        this.rapportForm.setValidators(this.dateRangeValidatorForReport('date_debut_annulation_t', 'date_fin_annulation_t'));
        break;

      default:
        this.showEntreeTicketFilters = false;
        this.showSortieTicketFilters = false;
        this.showRetourTicketFilters = false;
        this.showAnnulationTicketFilters = false;
        // this.rapportForm.reset({ id_type_rapport: typeRapportId });
        // Remettre à null toutes les dates spécifiques pour éviter des valeurs résiduelles
        this.resetSpecificDateControls();
        break;
    }
    // Décaler l'appel à updateValueAndValidity pour éviter ExpressionChangedAfterItHasBeenCheckedError
    setTimeout(() => {
        this.rapportForm.updateValueAndValidity();
      }, 0);
    this.errorMessage = '';
    this.rows = [];
    this.temp = [];
    this.cd.detectChanges(); // Force la détection des changements après la mise à jour du formulaire
  }

  private resetFormControls(): void {
    // Liste de tous les contrôles de filtres spécifiques (sauf 'id_type_rapport')
    const allSpecificControls = [
      'date_debut_entree_t', 'date_fin_entree_t', 'coupon_ticket_id_entree', 'compagnie_id_entree',
      'date_debut_sortie_t', 'date_fin_sortie_t', 'coupon_ticket_id_sortie', 'compagnie_id_sortie', 'employe_id_sortie', 'vehicule_id_sortie', 'depart_id_sortie', 'arriver_id_sortie',
      'date_debut_retour_t', 'date_fin_retour_t', 'coupon_id_retour', 'compagnie_id_retour',
      'date_debut_annulation_t', 'date_fin_annulation_t', 'coupon_id_annulation', 'compagnie_id_annulation',
    ];

    allSpecificControls.forEach(key => {
      const control = this.rapportForm.get(key);
      if (control) {
        control.disable();
        control.clearValidators();
        control.setValue(null);
      }
    });

    this.rapportForm.clearValidators(); // Efface les validateurs de niveau FormGroup
    // this.rapportForm.get('id_type_rapport')?.setValidators(Validators.required); // Ré-applique le validateur pour le type de rapport
    // this.rapportForm.updateValueAndValidity(); // Très important
    // Assurer que les indicateurs d'affichage sont tous false par défaut
    this.showEntreeTicketFilters = false;
    this.showSortieTicketFilters = false;
    this.showRetourTicketFilters = false;
    this.showAnnulationTicketFilters = false;
  }

  private resetSpecificDateControls(): void {
    // Cette fonction est appelée uniquement par le "default" case pour remettre les dates à null
    this.rapportForm.get('date_debut_entree_t')?.setValue(null);
    this.rapportForm.get('date_fin_entree_t')?.setValue(null);
    this.rapportForm.get('date_debut_sortie_t')?.setValue(null);
    this.rapportForm.get('date_fin_sortie_t')?.setValue(null);
    this.rapportForm.get('date_debut_retour_t')?.setValue(null);
    this.rapportForm.get('date_fin_retour_t')?.setValue(null);
    this.rapportForm.get('date_debut_annulation_t')?.setValue(null);
    this.rapportForm.get('date_fin_annulation_t')?.setValue(null);
  }


  loadFilterData(): void {
    this.couponTicketService.getAllCouponTickets().pipe(takeUntil(this.destroy$)).subscribe((data: CouponTicket[]) => this.couponTicketsList = data);
    this.compagnieService.getAllCompagniePetrolieres().pipe(takeUntil(this.destroy$)).subscribe((data: CompagniePetroliere[]) => this.compagniesList = data);
    this.employesService.getAllEmployes().pipe(takeUntil(this.destroy$)).subscribe((data: Employe[]) => this.employesList = data);
    this.vehiculeService.getAllVehicules().pipe(takeUntil(this.destroy$)).subscribe((data: Vehicule[]) => this.vehiculesList = data);
    // this.departService.getAllDeparts().pipe(takeUntil(this.destroy$)).subscribe((data: Depart[]) => this.departsList = data);
    // this.arriverService.getAllArrivers().pipe(takeUntil(this.destroy$)).subscribe((data: Arriver[]) => this.arriversList = data);
  }

  loadRapportTicket(): void {
    console.log('--- Tentative de chargement du rapport de ticket ---');
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
        id_type_rapport: this.selectedReportTypeId,
    };

    // Construire les filtres en fonction du type de rapport sélectionné
    switch (this.selectedReportTypeId) {
        case 'entree ticket':
            filters.date_debut = this.formatDate(this.rapportForm.get('date_debut_entree_t')?.value);
            filters.date_fin = this.formatDate(this.rapportForm.get('date_fin_entree_t')?.value);
            filters.coupon_ticket_id = this.rapportForm.get('coupon_ticket_id_entree')?.value;
            filters.compagnie_id = this.rapportForm.get('compagnie_id_entree')?.value;
            break;
        case 'sortie ticket':
            filters.date_debut = this.formatDate(this.rapportForm.get('date_debut_sortie_t')?.value);
            filters.date_fin = this.formatDate(this.rapportForm.get('date_fin_sortie_t')?.value);
            filters.coupon_ticket_id = this.rapportForm.get('coupon_ticket_id_sortie')?.value;
            filters.compagnie_id = this.rapportForm.get('compagnie_id_sortie')?.value;
            filters.employe_id = this.rapportForm.get('employe_id_sortie')?.value;
            filters.vehicule_id = this.rapportForm.get('vehicule_id_sortie')?.value;
            filters.depart_id = this.rapportForm.get('depart_id_sortie')?.value;
            filters.arriver_id = this.rapportForm.get('arriver_id_sortie')?.value;
            break;
        case 'retour ticket':
            filters.date_debut = this.formatDate(this.rapportForm.get('date_debut_retour_t')?.value);
            filters.date_fin = this.formatDate(this.rapportForm.get('date_fin_retour_t')?.value);
            filters.coupon_id = this.rapportForm.get('coupon_id_retour')?.value;
            filters.compagnie_id = this.rapportForm.get('compagnie_id_retour')?.value;
            break;
        case 'annulation ticket':
            filters.date_debut = this.formatDate(this.rapportForm.get('date_debut_annulation_t')?.value);
            filters.date_fin = this.formatDate(this.rapportForm.get('date_fin_annulation_t')?.value);
            filters.coupon_id = this.rapportForm.get('coupon_id_annulation')?.value;
            filters.compagnie_id = this.rapportForm.get('compagnie_id_annulation')?.value;
            break;
    }

    // Nettoyer les filtres vides avant l'envoi
    Object.keys(filters).forEach(key => {
        if (filters[key] === null || filters[key] === undefined || filters[key] === '') {
            delete filters[key];
        }
    });

    console.log('Envoi des filtres au backend pour le rapport de ticket:', filters);

    this.ticketRapportService.getRapportData(filters).pipe(takeUntil(this.destroy$)).subscribe(
      (response: BackendPostResource<PaginatedResponse<MouvementTicket | RetourTicket | AnnulationTicket>>) => {
        console.log('Réponse du backend (brute du service Ticket):', response);
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
        console.log('Données du rapport de ticket chargées et affichées:', this.rows);
      },
      (error: any) => {
        console.error('Erreur lors du chargement du rapport de ticket:', error);
        this.errorMessage = `Erreur lors du chargement du rapport de ticket: ${error.message || 'Veuillez réessayer.'}`;
        this.loadingIndicator = false;
        this.isGeneratingReport = false;
        this.rows = [];
        this.temp = [];
      }
    );
  }

  downloadRapportTicketPDF(): void {
    console.log('--- Tentative d\'impression du rapport de ticket PDF ---');
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
        id_type_rapport: this.selectedReportTypeId,
    };

    // Construire les filtres en fonction du type de rapport sélectionné pour le PDF
    switch (this.selectedReportTypeId) {
        case 'entree ticket':
            filters.date_debut = this.formatDate(this.rapportForm.get('date_debut_entree_t')?.value);
            filters.date_fin = this.formatDate(this.rapportForm.get('date_fin_entree_t')?.value);
            filters.coupon_ticket_id = this.rapportForm.get('coupon_ticket_id_entree')?.value;
            filters.compagnie_id = this.rapportForm.get('compagnie_id_entree')?.value;
            break;
        case 'sortie ticket':
            filters.date_debut = this.formatDate(this.rapportForm.get('date_debut_sortie_t')?.value);
            filters.date_fin = this.formatDate(this.rapportForm.get('date_fin_sortie_t')?.value);
            filters.coupon_ticket_id = this.rapportForm.get('coupon_ticket_id_sortie')?.value;
            filters.compagnie_id = this.rapportForm.get('compagnie_id_sortie')?.value;
            filters.employe_id = this.rapportForm.get('employe_id_sortie')?.value;
            filters.vehicule_id = this.rapportForm.get('vehicule_id_sortie')?.value;
            filters.depart_id = this.rapportForm.get('depart_id_sortie')?.value;
            filters.arriver_id = this.rapportForm.get('arriver_id_sortie')?.value;
            break;
        case 'retour ticket':
            filters.date_debut = this.formatDate(this.rapportForm.get('date_debut_retour_t')?.value);
            filters.date_fin = this.formatDate(this.rapportForm.get('date_fin_retour_t')?.value);
            filters.coupon_id = this.rapportForm.get('coupon_id_retour')?.value;
            filters.compagnie_id = this.rapportForm.get('compagnie_id_retour')?.value;
            break;
        case 'annulation ticket':
            filters.date_debut = this.formatDate(this.rapportForm.get('date_debut_annulation_t')?.value);
            filters.date_fin = this.formatDate(this.rapportForm.get('date_fin_annulation_t')?.value);
            filters.coupon_id = this.rapportForm.get('coupon_id_annulation')?.value;
            filters.compagnie_id = this.rapportForm.get('compagnie_id_annulation')?.value;
            break;
    }

    Object.keys(filters).forEach(key => {
        if (filters[key] === null || filters[key] === undefined || filters[key] === '') {
            delete filters[key];
        }
    });

    console.log('Envoi des filtres pour PDF au backend pour le rapport de ticket:', filters);

    this.ticketRapportService.imprimerRapportData(filters).pipe(takeUntil(this.destroy$)).subscribe(
      (response: Blob) => {
        console.log('Réponse PDF reçue du backend.');
        const fileURL = window.URL.createObjectURL(response);
        const a = document.createElement('a');
        a.href = fileURL;
        a.download = `rapport_ticket_${this.selectedReportTypeId}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(fileURL);
        this.isGeneratingReport = false;
      },
      (error: any) => {
        console.error('Erreur lors du téléchargement du PDF du rapport de ticket:', error);
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
            switch (this.selectedReportTypeId) {
                case 'entree ticket':
                    const entree = item as MouvementTicket;
                    match = (entree.coupon_ticket?.libelle?.toLowerCase().includes(val) || false) ||
                            (entree.compagnie_petrolier?.libelle?.toLowerCase().includes(val) || false);
                    break;
                case 'sortie ticket':
                    const sortie = item as MouvementTicket;
                    match =
                            (sortie.coupon_ticket?.libelle?.toLowerCase().includes(val) || false) ||
                            (sortie.compagnie_petrolier?.libelle?.toLowerCase().includes(val) || false) ||
                            (sortie.employe?.nom?.toLowerCase().includes(val) || false) ||
                            (sortie.vehicule?.immatriculation?.toLowerCase().includes(val) || false)
                            ;
                            // (sortie.depart?.libelle_depart?.toLowerCase().includes(val) || false) ||
                            // (sortie.arriver?.libelle_arriver?.toLowerCase().includes(val) || false)
                    break;
                case 'retour ticket':
                    const retour = item as RetourTicket;
                    match =
                            (retour.coupon_ticket?.libelle?.toLowerCase().includes(val) || false) ||
                            (retour.compagnie_petrolier?.libelle?.toLowerCase().includes(val) || false);
                            // (retour.mouvementTicket?.vehicule?.immatriculation?.toLowerCase().includes(val) || false)
                    break;
                case 'annulation ticket':
                    const annulation = item as AnnulationTicket;
                    match =
                            (annulation.coupon_ticket?.libelle?.toLowerCase().includes(val) || false) ||
                            (annulation.compagnie_petrolier?.libelle?.toLowerCase().includes(val) || false);
                            // (annulation.mouvement?.employe?.nom?.toLowerCase().includes(val) || annulation.mouvement?.employe?.prenom?.toLowerCase().includes(val) || false) ||
                            // (annulation.mouvement?.vehicule?.immatriculation?.toLowerCase().includes(val) || false)
                    break;
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
