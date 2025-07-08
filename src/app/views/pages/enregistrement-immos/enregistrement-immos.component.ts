import { Component, ViewChild, OnInit, inject, ViewEncapsulation, OnDestroy } from '@angular/core'; // Ajout de OnDestroy
import { RouterLink } from '@angular/router';
import { ColumnMode, DatatableComponent, NgxDatatableModule } from '@siemens/ngx-datatable';
import { ImmobilisationsService } from '../../../core/services/enregistrement-immos/enregistrement-immos.service';
// Assurez-vous que ces interfaces sont bien définies et importées :
import { Immobilisation, Fournisseur, StatusImmo, SousTypeImmo, GroupeTypeImmo, Vehicule } from '../../../core/services/interface/models';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule, FormArray } from "@angular/forms";
import { CommonModule } from '@angular/common';
import { NgbAlertModule, NgbCalendar, NgbDateStruct, NgbDatepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectComponent as MyNgSelectComponent } from '@ng-select/ng-select';
import { FeatherIconDirective } from '../../../core/feather-icon/feather-icon.directive';
import { Router } from '@angular/router';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

declare var bootstrap: any;

@Component({
  selector: 'app-enregistrement-immos',
  standalone: true,
  imports: [
    RouterLink,
    NgxDatatableModule,
    ReactiveFormsModule,
    CommonModule,
    NgbAlertModule,
    NgbDropdownModule,
    NgbDatepickerModule,
    MyNgSelectComponent,
    FeatherIconDirective
  ],
  templateUrl: 'enregistrement-immos.component.html',
  styleUrls: ['enregistrement-immos.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ImmobilisationComponent implements OnInit, OnDestroy { // Implémente OnDestroy
  currentDate: NgbDateStruct = inject(NgbCalendar).getToday();
  private destroy$ = new Subject<void>(); // Pour gérer la désinscription des observables

  // PROPRIÉTÉS POUR LA GESTION DES PERMISSIONS
  allowedFonctionnalites: string[] = [];
  canAddImmo: boolean = true;
  canViewImmoEntries: boolean = true;
  canAffectImmo: boolean = true;
  canInvertImmo: boolean = true;
  canExportImmo: boolean = true;
  canModifyImmo: boolean = true;
  canDeleteImmo: boolean = true;
  hasPageAccess: boolean = true;

  rows: Immobilisation[] = [];
  temp: Immobilisation[] = [];
  loadingIndicator = true;
  reorderable = true;
  ColumnMode = ColumnMode;

  alertAjoutVisible: boolean = false;
  alertModifVisible: boolean = false;
  alertSuppVisible: boolean = false;

  public addImmobilisation!: FormGroup;
  public editImmobilisation!: FormGroup;
  public deleteImmobilisation!: FormGroup;

  fournisseurs: Fournisseur[] = [];
  vehicules: Vehicule[] = [];
  statusImmo: StatusImmo[] = [];
  sousTypeImmo: SousTypeImmo[] = [];
  groupeTypeImmo: GroupeTypeImmo[] = [];

  etatOptions: string[] = ['Bon', 'Usé', 'Défectueux / En panne', 'Irréparable'];

  isAddingImmobilisation: boolean = false;
  public selectedImmobilisation: any = null;

  @ViewChild('table') table!: DatatableComponent;

  constructor(private immobilisationService: ImmobilisationsService, private formBuilder: FormBuilder, private router: Router) { }

  ngOnInit(): void {
    // INITIALISER LES PERMISSIONS EN PREMIER
    this.initializePermissions();

    // Ensuite charger les données seulement si on a accès
    if (this.hasPageAccess) {
      this.loadImmobilisations();
      this.loadFournisseurs();
      this.loadStatusImmo();
      this.loadSousTypeImmo();
      this.loadGroupeTypeImmo();
      this.loadVehicules();
    }

    this.addImmobilisation = this.formBuilder.group({
      bureau_id: [null, []],
      employe_id: [null, []],
      date_mouvement: [null, []],
      fournisseur_id: [null, []],
      designation: ["", [Validators.required]],
      isVehicule: [0, [Validators.required]],
      vehicule_id: [null, []],
      code: ["", [Validators.required]],
      id_groupe_type_immo: [null, [Validators.required]],
      id_sous_type_immo: [null, [Validators.required]],
      duree_amorti: [null, []], // MODIFIÉ: plus de Validators.required
      etat: ["", [Validators.required]],
      taux_ammortissement: ["", [Validators.required]],
      duree_ammortissement: ["", [Validators.required]],
      date_acquisition: [null, [Validators.required]], // MODIFIÉ: null comme valeur initiale pour NgbDateStruct
      date_mise_en_service: ["", []],
      observation: [""],
      id_status_immo: [null, [Validators.required]],
      montant_ttc: ["", [Validators.required]],
    });

    this.editImmobilisation = this.formBuilder.group({
      id: [0, [Validators.required]],
      bureau_id: [null, []],
      employe_id: [null, []],
      date_mouvement: [null, []],
      fournisseur_id: [null, []],
      designation: ["", [Validators.required]],
      isVehicule: [0, [Validators.required]],
      vehicule_id: [null, []],
      code: ["", [Validators.required]],
      id_groupe_type_immo: [null, [Validators.required]],
      id_sous_type_immo: [null, [Validators.required]],
      duree_amorti: [null, []], // MODIFIÉ: plus de Validators.required
      etat: ["", [Validators.required]],
      taux_ammortissement: ["", [Validators.required]],
      duree_ammortissement: ["", [Validators.required]],
      date_acquisition: [null, [Validators.required]], // MODIFIÉ: null comme valeur initiale pour NgbDateStruct
      date_mise_en_service: ["", []],
      observation: [""],
      id_status_immo: [null, [Validators.required]],
      montant_ttc: ["", [Validators.required]],
    });

    this.deleteImmobilisation = this.formBuilder.group({
      id: [0, [Validators.required]],
    });

    // NOUVEAU: Écouteur pour la date d'acquisition dans le formulaire d'ajout
    this.addImmobilisation.get('date_acquisition')?.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(date => {
      console.log('Debug: date_acquisition changed (Add Form):', date); // Debug log
      this.calculateDureeAmortie(date, this.addImmobilisation);
    });

    // NOUVEAU: Écouteur pour la date d'acquisition dans le formulaire de modification
    this.editImmobilisation.get('date_acquisition')?.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(date => {
      console.log('Debug: date_acquisition changed (Edit Form):', date); // Debug log
      this.calculateDureeAmortie(date, this.editImmobilisation);
    });
  }

  // NOUVEAU: Méthode pour désinscrire les observables lors de la destruction du composant
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // NOUVELLE MÉTHODE : Initialiser les permissions
  private initializePermissions(): void {
    try {
      const allowedFonctionnalitesStr = localStorage.getItem('allowedFonctionnalites');

      if (!allowedFonctionnalitesStr) {
        console.log('⚠️ Aucune fonctionnalité trouvée - Permissions par défaut');
        return; // Garder les permissions par défaut (true)
      }

      const allowedFonctionnalites: string[] = JSON.parse(allowedFonctionnalitesStr);
      console.log('📋 Fonctionnalités autorisées:', allowedFonctionnalites);

      // VÉRIFICATION DES PERMISSIONS SPÉCIFIQUES
      this.canAddImmo = allowedFonctionnalites.includes('Ajout immobilisation');
      this.canAffectImmo = allowedFonctionnalites.includes('Affectation Immobilisation');
      this.canInvertImmo = allowedFonctionnalites.includes('Intervention Immobilisation');
      this.canExportImmo = allowedFonctionnalites.includes('Exporter immobilisation');
      this.canModifyImmo = allowedFonctionnalites.includes('Modification immobilisation');
      this.canDeleteImmo = allowedFonctionnalites.includes('Suppression immobilisation');
      this.canViewImmoEntries = allowedFonctionnalites.includes('Voir les immobilisations');

      // ACCÈS À LA PAGE : Si au moins une fonctionnalité d'immobilisation est autorisée
      this.hasPageAccess = this.canViewImmoEntries;

      console.log('🔐 Permissions calculées:', {
        canAddImmo: this.canAddImmo,
        canAffectImmo: this.canAffectImmo,
        canInvertImmo: this.canInvertImmo,
        canExportImmo: this.canExportImmo,
        canModifyImmo: this.canModifyImmo,
        canDeleteImmo: this.canDeleteImmo,
        hasPageAccess: this.hasPageAccess
      });

      // SI AUCUN ACCÈS, REDIRIGER VERS LE DASHBOARD
      if (!this.hasPageAccess) {
        console.warn('❌ Accès refusé à la gestion des immobilisations');
        this.router.navigate(['/error/403']);
        return;
      }

    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation des permissions:', error);
      // En cas d'erreur, garder les permissions par défaut (true)
    }
  }

  // NOUVELLE MÉTHODE : Définir les permissions par défaut
  private setDefaultPermissions(): void {
    this.canAddImmo = true;
    this.canAffectImmo = true;
    this.canInvertImmo = true;
    this.canExportImmo = true;
    this.canModifyImmo = true;
    this.canDeleteImmo = true;
    this.canViewImmoEntries = true; // Ajouté pour la cohérence

    this.hasPageAccess = true;
    console.log('✅ Permissions par défaut appliquées');
  }

  // NOUVELLE MÉTHODE pour "Voir plus"
  getViewForm(row: any): void {
    this.selectedImmobilisation = row; // Stocker la ligne sélectionnée
    console.log('Immobilisation sélectionnée:', this.selectedImmobilisation);
  }

  onClickSubmitAddImmobilisation() {
    if (!this.canAddImmo) {
      alert('Vous n\'avez pas l\'autorisation d\'ajouter une immobilisation.');
      return;
    }

    console.log('Debug: onClickSubmitAddImmobilisation appelé. isAddingImmobilisation:', this.isAddingImmobilisation);

    // AJOUT DE LA VÉRIFICATION POUR PRÉVENIR LES DOUBLES CLICS
    if (this.isAddingImmobilisation) {
      console.warn('Debug: Soumission multiple détectée pour Immobilisation. Annulation.');
      return; // Empêche l'exécution si déjà en cours
    }

    const spinner = document.querySelector('.spinner-add-immobilisation');

    if (this.addImmobilisation.valid) {
      this.isAddingImmobilisation = true; // Désactiver le bouton
      console.log('Debug: isAddingImmobilisation mis à true.');

      if (spinner) {
        spinner.classList.remove('d-none');
        console.log('Debug: Spinner Immobilisation affiché.');
      }

      const formData = {
        ...this.addImmobilisation.value,
        // Convertir la date d'acquisition au format YYYY-MM-DD pour le backend
        date_acquisition: this.formatNgbDateToYYYYMMDD(this.addImmobilisation.value.date_acquisition),
      };
      this.immobilisationService.saveImmobilisation(formData).subscribe(
        (data: any) => {
          this.loadImmobilisations();
          if (spinner) spinner.classList.add('d-none');
          this.addImmobilisation.reset();
          this.addImmobilisation.patchValue({ isVehicule: 0 }); // Remettre la valeur par défaut pour la checkbox
          this.isAddingImmobilisation = false;
          console.log('Debug: Soumission Immobilisation réussie. isAddingImmobilisation mis à false.');

          const modal = document.getElementById('add_immobilisation');
          const bsModal = bootstrap.Modal.getInstance(modal);
          bsModal?.hide();

          setTimeout(() => {
            this.alertAjoutVisible = true;
            console.log('Debug: Alert visible après fermeture du modal:', this.alertAjoutVisible);
            setTimeout(() => {
              this.alertAjoutVisible = false;
            }, 2000);
          }, 200);
        },
        (error: any) => {
          console.error('Debug: Erreur lors de l\'ajout de l\'Immobilisation :', error);
          if (spinner) spinner.classList.add('d-none');
          this.isAddingImmobilisation = false;
          console.error('Debug: Soumission Immobilisation échouée. isAddingImmobilisation mis à false.');
          alert('Une erreur s\'est produite. Veuillez réessayer.');
        }
      );
    } else {
      if (spinner) spinner.classList.add('d-none');
      this.markFormGroupTouched(this.addImmobilisation);
      alert("Désolé, le formulaire n'est pas bien renseigné");
      console.log('Debug: Formulaire Immobilisation invalide.');
    }
  }

  onClickSubmitEditImmobilisation() {
    if (!this.canModifyImmo) {
      alert('Vous n\'avez pas l\'autorisation de modifier cette immobilisation.');
      return;
    }

    console.log('Debug: onClickSubmitEditImmobilisation appelé. Form value:', this.editImmobilisation.value);
    const spinner = document.querySelector('.spinnerModif');

    // Il est recommandé d'ajouter une propriété isEditingImmobilisation
    // isEditingImmobilisation: boolean = false;
    // if (this.isEditingImmobilisation) { return; }
    // this.isEditingImmobilisation = true;

    if (this.editImmobilisation.valid) {
      if (spinner) spinner.classList.remove('d-none');
      const formData = {
        ...this.editImmobilisation.value,
        // Convertir la date d'acquisition au format YYYY-MM-DD pour le backend
        date_acquisition: this.formatNgbDateToYYYYMMDD(this.editImmobilisation.value.date_acquisition),
      };
      this.immobilisationService.editImmobilisation(formData).subscribe(
        (data: any) => {
          this.loadImmobilisations();
          if (spinner) spinner.classList.add('d-none');
          this.editImmobilisation.reset();
          // this.isEditingImmobilisation = false;

          const modal = document.getElementById('edit_immobilisation');
          const bsModal = bootstrap.Modal.getInstance(modal);
          bsModal?.hide();

          setTimeout(() => {
            this.alertModifVisible = true;
            console.log('Debug: Alert visible après fermeture du modal:', this.alertModifVisible);
            setTimeout(() => {
              this.alertModifVisible = false;
            }, 2000);
          }, 200);
        },
        (error: any) => {
          console.error('Debug: Erreur lors de la modification de l\'Immobilisation :', error);
          if (spinner) spinner.classList.add('d-none');
          // this.isEditingImmobilisation = false;
          alert('Une erreur s\'est produite. Veuillez réessayer.');
        }
      );
    } else {
      if (spinner) spinner.classList.add('d-none');
      alert("Désolé, le formulaire n'est pas bien renseigné");
    }
  }

  onClickSubmitDeleteImmobilisation() {
    if (!this.canDeleteImmo) {
      alert('Vous n\'avez pas l\'autorisation de Supprimer cette immobilisation.');
      return;
    }

    console.log('Debug: onClickSubmitDeleteImmobilisation appelé. Form value:', this.deleteImmobilisation.value);
    const spinner = document.querySelector('.spinnerDelete');

    // Il est recommandé d'ajouter une propriété isDeletingImmobilisation
    // isDeletingImmobilisation: boolean = false;
    // if (this.isDeletingImmobilisation) { return; }
    // this.isDeletingImmobilisation = true;

    if (this.deleteImmobilisation.valid) {
      if (spinner) spinner.classList.remove('d-none');
      this.immobilisationService.deleteImmobilisation(this.deleteImmobilisation.value).subscribe(
        (data: any) => {
          this.loadImmobilisations();
          if (spinner) spinner.classList.add('d-none');
          this.deleteImmobilisation.reset();
          // this.isDeletingImmobilisation = false;

          const modal = document.getElementById('delete_immobilisation');
          const bsModal = bootstrap.Modal.getInstance(modal);
          bsModal?.hide();

          setTimeout(() => {
            this.alertSuppVisible = true;
            console.log('Debug: Alert visible après fermeture du modal:', this.alertSuppVisible);
            setTimeout(() => {
              this.alertSuppVisible = false;
            }, 2000);
          }, 200);
        },
        (error: any) => {
          console.error('Debug: Erreur lors de la supression de l\'Immobilisation :', error);
          if (spinner) spinner.classList.add('d-none');
          // this.isDeletingImmobilisation = false;
          alert('Une erreur s\'est produite. Veuillez réessayer.');
        }
      );
    } else {
      if (spinner) spinner.classList.add('d-none');
      alert("Désolé, le formulaire n'est pas bien renseigné");
    }
  }

  // Fonction utilitaire pour marquer tous les champs comme touchés (validation)
  markFormGroupTouched(formGroup: FormGroup | FormArray) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();

      if (control instanceof FormGroup || control instanceof FormArray) {
        this.markFormGroupTouched(control);
      }
    });
  }


  loadImmobilisations(): void {
    this.immobilisationService.getAllImmobilisations().subscribe(
      (data: Immobilisation[]) => {
        this.temp = [...data];
        this.rows = data;
        this.loadingIndicator = false;
      },
      error => {
        console.error('Erreur lors du chargement des Immobilisations', error);
        this.loadingIndicator = false;
      }
    );
  }

  updateFilter(event: KeyboardEvent): void {
    const val = (event.target as HTMLInputElement).value.toLowerCase();

    this.rows = this.temp.filter(immo =>
      (immo.code && immo.code.toLowerCase().includes(val)) ||
      (immo.designation && immo.designation.toLowerCase().includes(val)) ||
      (immo.statusImmo && immo.statusImmo.libelle_status_immo && immo.statusImmo.libelle_status_immo.toLowerCase().includes(val)) ||
      (immo.groupeTypeImmo && immo.groupeTypeImmo.libelle && immo.groupeTypeImmo.libelle.toLowerCase().includes(val))
    );

    // Important : réinitialiser l'offset de la table pour afficher les résultats filtrés depuis le début
    this.table.offset = 0;
  }

  getEditForm(row: any) {
    const ngbDateAcquisition = this.convertToNgbDate(row.date_acquisition);
    
    this.editImmobilisation.patchValue({
      id: row.id,
      bureau_id: row.bureau_id,
      employe_id: row.employe_id,
      date_mouvement: row.date_mouvement,
      fournisseur_id: row.fournisseur_id,
      designation: row.designation,
      isVehicule: row.isVehicule ? 1 : 0,
      vehicule_id: row.vehicule_id,
      code: row.code,
      id_groupe_type_immo: row.id_groupe_type_immo,
      id_sous_type_immo: row.id_sous_type_immo,
      duree_amorti: row.duree_amorti, // Laisser la valeur existante, elle sera recalculée si la date change
      etat: row.etat,
      taux_ammortissement: row.taux_ammortissement,
      duree_ammortissement: row.duree_ammortissement,
      date_acquisition: ngbDateAcquisition, // Utiliser la NgbDateStruct
      date_mise_en_service: row.date_mise_en_service,
      observation: row.observation,
      id_status_immo: row.id_status_immo,
      montant_ttc: row.montant_ttc,
    });
    // NOUVEAU: Déclenchez le calcul de la durée amortie lors de l'ouverture du formulaire d'édition
    // C'est important si la date d'acquisition est déjà remplie à l'ouverture du modal
    console.log('Debug: Patching date_acquisition (Edit Form):', ngbDateAcquisition); // Debug log
    this.calculateDureeAmortie(ngbDateAcquisition, this.editImmobilisation);
  }

  getDeleteForm(row: any) {
    this.deleteImmobilisation.patchValue({
      id: row.id,
    })
  }

  onCheckboxChange(event: any) {
    this.addImmobilisation.patchValue({
      isVehicule: event.target.checked ? 1 : 0
    });
  }

  onCheckboxEditChange(event: any) {
    this.editImmobilisation.patchValue({
      isVehicule: event.target.checked ? 1 : 0
    });
  }

  loadFournisseurs(): void {
    this.immobilisationService.getAllFournisseurs().subscribe({
      next: (data) => {
        this.fournisseurs = data;
      },
      error: (err) => {
        console.error("Erreur lors du chargement des fournisseurs :", err);
      }
    });
  }

  loadVehicules(): void {
    this.immobilisationService.getAllVehicules().subscribe({
      next: (data) => {
        this.vehicules = data;
      },
      error: (err) => {
        console.error("Erreur lors du chargement des Vehicules :", err);
      }
    });
  }

  loadStatusImmo(): void {
    this.immobilisationService.getAllStatusImmos().subscribe({
      next: (data) => {
        this.statusImmo = data.filter(status => status.libelle_status_immo !== 'En service');
      },
      error: (err) => {
        console.error("Erreur lors du chargement des StatusImmo :", err);
      }
    });
  }

  loadSousTypeImmo(): void {
    this.immobilisationService.getAllSousTypeImmos().subscribe({
      next: (data) => {
        this.sousTypeImmo = data;
      },
      error: (err) => {
        console.error("Erreur lors du chargement des SousTypeImmo :", err);
      }
    });
  }

  loadGroupeTypeImmo(): void {
    this.immobilisationService.getAllGroupeTypeImmos().subscribe({
      next: (data) => {
        this.groupeTypeImmo = data;
      },
      error: (err) => {
        console.error("Erreur lors du chargement des groupeTypeImmo :", err);
      }
    });
  }

  // MODIFIÉ: Renommé pour être plus explicite sur son rôle (pour le backend)
  formatNgbDateToYYYYMMDD(date: NgbDateStruct | null): string | null {
    if (!date) return null;
    const year = date.year;
    const month = date.month.toString().padStart(2, '0');
    const day = date.day.toString().padStart(2, '0');
    return `${year}-${month}-${day}`; // Format YYYY-MM-DD
  }

  // NOUVEAU: Fonction utilitaire pour formater une date en "JJ/MM/AAAA" pour la recherche
  /**
   * Fonction utilitaire pour formater une date en "JJ/MM/AAAA".
   * Gère les objets Date et les chaînes de caractères (y compris "AAAA-MM-JJ" ou "JJ/MM/AAAA").
   * @param dateInput La date à formater (peut être un objet Date ou une chaîne).
   * @returns La date formatée en "JJ/MM/AAAA" ou une chaîne vide si invalide.
   */
  private formatDateForSearch(dateInput: any): string {
    if (!dateInput) {
      return '';
    }

    let date: Date;

    // Si c'est déjà un objet Date
    if (dateInput instanceof Date) {
      date = dateInput;
    }
    // Si c'est une chaîne, essayez de la parser de manière robuste
    else if (typeof dateInput === 'string') {
      // Tente de parser "JJ/MM/AAAA"
      const parts = dateInput.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
      if (parts) {
        // Constructeur Date: année, mois (0-indexé), jour
        date = new Date(parseInt(parts[3]), parseInt(parts[2]) - 1, parseInt(parts[1]));
      } else {
        // Fallback pour les chaînes ISO (ex: "2024-07-01T...") ou "AAAA-MM-JJ" que new Date() gère bien
        date = new Date(dateInput);
      }
    } else {
      // Si ce n'est ni Date ni string, tentez une conversion en string puis parsez
      date = new Date(String(dateInput));
    }

    // Vérifiez si la date est valide
    if (isNaN(date.getTime())) {
      return ''; // Retourne une chaîne vide pour les dates invalides
    }

    // Formate la date en JJ/MM/AAAA
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Les mois sont 0-indexés
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  // Méthode pour convertir "YYYY-MM-DD" en NgbDateStruct
  convertToNgbDate(dateString: string): NgbDateStruct | null {
    if (!dateString) return null;
    const parts = dateString.split('-'); // Séparer YYYY-MM-DD
    // Vérifier que les parties sont des nombres valides
    if (parts.length === 3 && !isNaN(+parts[0]) && !isNaN(+parts[1]) && !isNaN(+parts[2])) {
      return {
        year: +parts[0],
        month: +parts[1],
        day: +parts[2],
      };
    }
    return null; // Retourner null si le format n'est pas valide
  }

  // NOUVELLE MÉTHODE : Calculer la durée amortie en mois
  private calculateDureeAmortie(dateAcquisition: NgbDateStruct | null, formGroup: FormGroup): void {
    console.log('Debug: calculateDureeAmortie appelée avec dateAcquisition:', dateAcquisition); // Debug log

    if (!dateAcquisition) {
      formGroup.get('duree_amorti')?.setValue(null); // Réinitialiser si pas de date
      console.log('Debug: duree_amorti mis à null (pas de date d\'acquisition)'); // Debug log
      return;
    }

    // Convertir NgbDateStruct en objet Date
    // Le mois de NgbDateStruct est 1-indexé, celui de l'objet Date est 0-indexé
    const acquisitionDate = new Date(dateAcquisition.year, dateAcquisition.month - 1, dateAcquisition.day);
    const today = new Date();

    // Mettre l'heure à 00:00:00 pour les deux dates pour éviter les problèmes de différence d'heure
    acquisitionDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    // Calculer la différence en mois
    let months;
    months = (today.getFullYear() - acquisitionDate.getFullYear()) * 12;
    months -= acquisitionDate.getMonth(); // Soustraire le mois de la date d'acquisition
    months += today.getMonth(); // Ajouter le mois de la date d'aujourd'hui

    // Ajuster si le jour actuel est avant le jour d'acquisition dans le mois
    // Cela permet de compter les mois complets. Ex: 1er Janvier au 28 Février = 1 mois. 1er Janvier au 1er Février = 1 mois.
    // 15 Janvier au 14 Février = 0 mois. 15 Janvier au 15 Février = 1 mois.
    if (today.getDate() < acquisitionDate.getDate()) {
        months--;
    }

    // S'assurer que le résultat n'est pas négatif
    const dureeAmortie = Math.max(0, months);

    // Mettre à jour le champ duree_amorti
    formGroup.get('duree_amorti')?.setValue(dureeAmortie);
    console.log('Debug: duree_amorti calculé:', dureeAmortie); // Debug log
  }


  downloadImmosPDF(): void {
    if (!this.canExportImmo) {
      alert('Vous n\'avez pas l\'autorisation d\'exporter la liste des immobilisations.');
      return;
    }

    this.immobilisationService.imprimerImmos().subscribe(
      (response: Blob) => {
        const fileURL = window.URL.createObjectURL(response);
        const a = document.createElement('a');
        a.href = fileURL;
        a.download = 'liste_immobilisations.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(fileURL);
      },
      error => {
        console.error('Erreur lors du téléchargement du PDF des immobilisations:', error);
        alert('Impossible de télécharger le PDF. Veuillez vérifier votre connexion ou contacter l\'administrateur.');
      }
    );
  }
}
