import { Component, ViewChild, OnInit, inject, TemplateRef,ViewEncapsulation } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ColumnMode, DatatableComponent, NgxDatatableModule } from '@siemens/ngx-datatable';
import { VehiculeService } from '../../../core/services/vehicules/vehicules.service';
import { Vehicule, Modele, Marque, Immobilisation,Fournisseur,StatusImmo, Bureau, SousTypeImmo, GroupeTypeImmo } from '../../../core/services/interface/models';
import { ImmobilisationsService } from '../../../core/services/enregistrement-immos/enregistrement-immos.service';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule, FormArray } from "@angular/forms";
import { CommonModule } from '@angular/common';
import { NgbAlertModule, NgbCalendar, NgbDateStruct, NgbDatepickerModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { NgSelectComponent as MyNgSelectComponent } from '@ng-select/ng-select';
import { Router } from '@angular/router';
import { HttpEventType, HttpClient } from '@angular/common/http'; // Import HttpClient pour l'upload de fichier
import { environment } from "../../../../environments/environment";
import Swal from 'sweetalert2';

declare var bootstrap: any; // Déclaration pour accéder à bootstrap globalement

@Component({
  selector: 'app-vehicules',
  standalone: true,
  imports: [
    RouterLink,
    NgxDatatableModule,
    ReactiveFormsModule,
    CommonModule,
    NgbAlertModule,
    NgbDropdownModule,
    FormsModule,
    NgbDatepickerModule,
    MyNgSelectComponent,
    // FeatherIconDirective // Ajoutez ceci si vous l'utilisez dans vehicules.component.html
  ],
  templateUrl: 'vehicules.component.html',
  styleUrls: ['vehicules.component.scss'],
  encapsulation: ViewEncapsulation.None
})

export class VehiculesComponent implements OnInit {

  typeEnergies: string[] = ['Essence', 'Gas-Oil'];

    // 🔥 PROPRIÉTÉS POUR LA GESTION DES PERMISSIONS
  allowedFonctionnalites: string[] = [];
  canAddVehicule: boolean = true;
  canViewVehicule: boolean = true;
  canModifyVehicule: boolean = true;
  canDeleteVehicule: boolean = true;
  hasPageAccess: boolean = true;
  public url: string = environment.base_url_backend;

  currentDate: NgbDateStruct = inject(NgbCalendar).getToday();

  rows: Vehicule[] = [];
  temp: Vehicule[] = [];
  loadingIndicator = true;
  reorderable = true;
  ColumnMode = ColumnMode;

  modeles: Modele[] = [];
  marques: Marque[] = [];

  statusImmo: StatusImmo[] = [];
  etatOptions: string[] = ['Bon', 'Usé', 'Défectueux / En panne', 'Irréparable'];

  fournisseurs: Fournisseur[] = [];
  sousTypeImmo: SousTypeImmo[] = [];
  groupeTypeImmo: GroupeTypeImmo[] = [];

  bureaux: Bureau[] = [];
  codesImmo: any[] = [];

  alertAjoutVisible: boolean = false;
  alertModifVisible: boolean = false;
  alertSuppVisible: boolean = false;
  alertImportVisible: boolean = false; // Nouvelle alerte pour l'import

  public addVehicule!: FormGroup;
  public editVehicule!: FormGroup;
  public carteGrise!: FormGroup;
  public deleteVehicule!: FormGroup;

  public selectedImmobilisation: any = null;

  isAddingVehicules: boolean = false;
  isDeletingVehicule: boolean = false;
  isEditingVehicule: boolean = false;
  isImporting: boolean = false; // Nouvelle propriété pour l'état d'importation
  selectedFile: File | null = null; // Pour stocker le fichier sélectionné

  public toastVisible: boolean = false;
  public toastType: 'success' | 'danger' | 'warning' | 'black' = 'success'; // Type d'alerte Bootstrap
  public toastTitle: string = '';
  public toastMessage: string = '';
  public ignoredLines: string[] = []; // Pour stocker les lignes ignorées

  selectedSousCompte: string = '0';
  selectedGroupeCompte: string = '0';

  @ViewChild('table') table!: DatatableComponent;
  @ViewChild('addVehiculeContent') addVehiculeContent!: TemplateRef<any>;
  @ViewChild('editVehiculeContent') editVehiculeContent!: TemplateRef<any>;
  @ViewChild('carteGriseContent') carteGriseContent!: TemplateRef<any>;
  @ViewChild('deleteVehiculeContent') deleteVehiculeContent!: TemplateRef<any>;

  constructor(
    private vehiculeService: VehiculeService,
    private formBuilder: FormBuilder,
    private router: Router,
    public modalService: NgbModal,
    private http: HttpClient, // Injecter HttpClient
    private immobilisationService: ImmobilisationsService
  ) { }


  //ici
  ngOnInit(): void {
    this.initializePermissions();
  
    if (this.hasPageAccess) {
      this.loadMarques();
      this.loadModeles();
      this.loadVehicules();
      this.loadSousTypeImmo();
      this.loadGroupeTypeImmo();
      this.loadFournisseurs();
      this.loadBureaux();
      this.loadStatusImmo();
      
      // 1. Cette méthode centralise déjà toute la création des formulaires 
      // et l'activation des calculs automatiques (valueChanges).
      this.initForm(); 
    }
  
    // 2. ACTIVE les écouteurs pour la date de mise en service
    this.setupAmortissementListeners();
  
    // 3. Calcul initial au chargement
    this.updateDateAmortissement();
    
    // NOTE : J'ai supprimé les blocs "this.editVehicule = ...", "this.deleteVehicule = ..." 
    // car ils faisaient double emploi avec initForm() et cassaient la logique.
  }

  private initializePermissions(): void {
    try {
      const allowedFonctionnalitesStr = localStorage.getItem('allowedFonctionnalites');

      if (!allowedFonctionnalitesStr) {
        console.log('⚠️ Aucune fonctionnalité trouvée - Permissions par défaut');
        return;
      }

      const allowedFonctionnalites: string[] = JSON.parse(allowedFonctionnalitesStr);
      console.log('📋 Fonctionnalités autorisées:', allowedFonctionnalites);

      this.canAddVehicule = allowedFonctionnalites.includes('Ajout vehicule');
      this.canModifyVehicule = allowedFonctionnalites.includes('Modification vehicule');
      this.canDeleteVehicule = allowedFonctionnalites.includes('Suppression vehicule');
      this.canViewVehicule = allowedFonctionnalites.includes('Voir parc vehicule');

      this.hasPageAccess = this.canViewVehicule ;

      console.log('🔐 Permissions calculées:', {
        canAddVehicule: this.canAddVehicule,
        canModifyVehicule: this.canModifyVehicule,
        canDeleteVehicule: this.canDeleteVehicule
      });

      if (!this.hasPageAccess) {
        console.warn('❌ Accès refusé à la page des entrées de stock');
        this.router.navigate(['/error/403']);
        return;
      }

    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation des permissions:', error);
    }
  }

  initForm(): void {
    this.addVehicule = this.formBuilder.group({
      vehicules: this.formBuilder.array([this.createVehiculeFormGroup()])
    });

    //

    this.editVehicule = this.formBuilder.group({
        id: [0, [Validators.required]],
        code: [null, [Validators.required]],
        marque_id: [null, [Validators.required]],
        modele_id: [null, [Validators.required]],
        immatriculation: ["", [Validators.required, Validators.pattern(/^[A-Z0-9\s-]+$/)]],
        numero_chassis: [""],
        puissance: [100, [Validators.required, Validators.min(1)]],
        places_assises: [4, [Validators.required, Validators.min(1)]],
        energie: ['Essence', Validators.required],
        kilometrage: [0, [Validators.required, Validators.min(0)]],
        // Initialiser avec une date string ISO
        date_mise_en_service: [this.getTodayDateString(), [Validators.required]],
        nbreannee_amortissement: [5, [Validators.min(1)]],
        // Le champ de date d'amortissement est désactivé et calculé
        date_amortissement: [{ value: '', disabled: false }],
        id_groupe_type_immo: [null, [Validators.required]],
        id_sous_type_immo: [null, [Validators.required]],
        //
        bureau_id: [null, []],
        fournisseur_id: [null, []],
        etat: ["", [Validators.required]],
        taux_ammortissement: ["", [Validators.required]],
        date_acquisition: [null, [Validators.required]],
        observation: [""],
        id_status_immo: [null, [Validators.required]],
        montant_ttc: ["", [Validators.required]],
    });

    this.deleteVehicule = this.formBuilder.group({ id: [null, [Validators.required]] });
    this.carteGrise = this.formBuilder.group({ id: [null, [Validators.required]] });

    // ÉCOUTEUR EDITION : On surveille le Taux pour calculer la Durée
    this.editVehicule.get('taux_ammortissement')?.valueChanges.subscribe(val => {
      this.calculateDuree(this.editVehicule, val);
    });
  }

  get vehiculesArray(): FormArray {
    return this.addVehicule.get('vehicules') as FormArray;
  }

  createVehiculeFormGroup(): FormGroup {
    const group = this.formBuilder.group({
      code: [null, [Validators.required]],
      marque_id: [null, [Validators.required]],
      modele_id: [null, [Validators.required]],
      immatriculation: ["", [Validators.required]],
      numero_chassis: [""],
      kilometrage: [null, [Validators.required, Validators.min(0)]],
      date_mise_en_service: ["", [Validators.required]],
      puissance: [""],
      places_assises: [null],
      energie: [""],
      nbreannee_amortissement: [5, [Validators.min(1)]],
      date_amortissement: [""],
      id_groupe_type_immo: [null, [Validators.required]],
      id_sous_type_immo: [null, [Validators.required]],
      //
      bureau_id: [null, []],
      fournisseur_id: [null, []],
      etat: ["", [Validators.required]],
      taux_ammortissement: ["", [Validators.required]],
      date_acquisition: [null, [Validators.required]],
      observation: [""],
      id_status_immo: [null, [Validators.required]],
      montant_ttc: ["", [Validators.required]],
    });

    // 🔹 Abonne-toi aux changements pour recalculer automatiquement
    group.get('date_mise_en_service')?.valueChanges.subscribe(() => {
      this.updateDateAmortissementForGroup(group);
    });
    group.get('nbreannee_amortissement')?.valueChanges.subscribe(() => {
      this.updateDateAmortissementForGroup(group);
    });

    // ÉCOUTEUR AJOUT BATCH : On surveille le Taux pour calculer la Durée
    group.get('taux_ammortissement')?.valueChanges.subscribe(val => {
      this.calculateDuree(group, val);
    });

    return group;
  }

  // LOGIQUE DE CALCUL : Durée = 100 / Taux
  calculateDuree(group: FormGroup, tauxInput: any) {
    const taux = parseFloat(tauxInput);
    if (!isNaN(taux) && taux > 0) {
      const duree = Math.round(100 / taux);
      group.get('nbreannee_amortissement')?.patchValue(duree, { emitEvent: false });
    } else {
      group.get('nbreannee_amortissement')?.patchValue(null, { emitEvent: false });
    }
  }


  addNewVehicule(): void {
    this.vehiculesArray.push(this.createVehiculeFormGroup());
  }

  removeVehicule(index: number): void {
    if (this.vehiculesArray.length > 1) {
      this.vehiculesArray.removeAt(index);
    }
  }

  // NOUVELLE MÉTHODE: Pour ouvrir le modal d'ajout
  openAddVehiculeModal(): void {
    this.initForm(); // Réinitialise le formulaire avant d'ouvrir le modal
    this.modalService.open(this.addVehiculeContent, { centered: true, size: 'xl' }); // Ouvre le modal
  }

  getTodayDateString(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  onClickSubmitAddVehicules(): void {
    console.log('onClickSubmitAddVehicules appelé. isAddingVehicules:', this.isAddingVehicules);

    if (this.isAddingVehicules) {
      console.warn('Soumission multiple détectée pour Véhicules. Annulation.');
      return;
    }

    const spinner = document.querySelector('.spinner-add-vehicule');

    if (this.addVehicule.valid) {
      this.isAddingVehicules = true;
      console.log('isAddingVehicules mis à true.');

      if (spinner) {
        spinner.classList.remove('d-none');
        console.log('Spinner Véhicule affiché.');
      }

      const vehiculesToSave = this.vehiculesArray.value.map((vehicule: any) => {

          if (!vehicule.id_sous_type_immo || !vehicule.id_groupe_type_immo) {
            throw new Error('Tous les véhicules doivent avoir un sous-type et un groupe type renseignés');
          }
          console.log("id_sous_type:", vehicule.id_sous_type_immo);
          console.log("id_groupe_type:", vehicule.id_groupe_type_immo);



        const dateMiseEnService = this.formatDate(vehicule.date_mise_en_service);
        const nbreannee = vehicule.nbreannee_amortissement || 5;

        const dateAmortissementCalculee = this.calculerDateAmortissement(dateMiseEnService, nbreannee);
        console.log(`DATE D'AMORTISSEMENT CALCULÉE: ${dateAmortissementCalculee}`); // ⭐ La ligne à ajouter/corriger ⭐
        return {
          ...vehicule,
          date_mise_en_service: this.formatDate(vehicule.date_mise_en_service),
          date_amortissement :dateAmortissementCalculee,
          nbreannee_amortissement: nbreannee,
          id_sous_type_immo: vehicule.id_sous_type_immo,
          id_groupe_type_immo: vehicule.id_groupe_type_immo,
          //
          date_acquisition: this.formatDate(vehicule.date_acquisition),
          montant_ttc:vehicule.montant_ttc,
          observation:vehicule.observation,
          bureau_id: vehicule.bureau_id,
          fournisseur_id: vehicule.fournisseur_id,
          id_status_immo: vehicule.id_status_immo,
          etat: vehicule.etat,
          taux_ammortissement: vehicule.taux_ammortissement,
        };
      });

      console.log('Payload envoyé :', { vehicules: vehiculesToSave });

      this.vehiculeService.saveMultipleVehicules(vehiculesToSave).subscribe(
        (data: any) => {
          this.loadVehicules();
          if (spinner) spinner.classList.add('d-none');
          this.initForm();
          this.isAddingVehicules = false;
          console.log('Soumission Véhicules réussie. isAddingVehicules mis à false.');

          // Fermer le modal manuellement
        const modal = document.getElementById('addVehicule');
        // @ts-ignore - pour éviter les erreurs TypeScript
        const bsModal = bootstrap.Modal.getInstance(modal);
        bsModal?.hide();

          setTimeout(() => {
            this.alertAjoutVisible = true;
            console.log('Alert visible après fermeture du modal:', this.alertAjoutVisible);
            setTimeout(() => {
              this.alertAjoutVisible = false;
            }, 2000);
          }, 200);
        },
        (error: any) => {
          console.error('Erreur lors de l\'ajout des Vehicules :', error);
          if (spinner) spinner.classList.add('d-none');
          this.isAddingVehicules = false;
          console.error('Soumission Véhicules échouée. isAddingVehicules mis à false.');
          
          // --- Logique d'affichage du message améliorée ---
          let detail = 'Veuillez vérifier les données saisies dans la liste des véhicules et réessayer.';

          if (error.status === 422) {
            // Erreur de validation (champs obligatoires, doublon de plaque, format)
            detail = 'Erreur de Validation : Certaines informations sont manquantes ou incorrectes (ex. plaque d\'immatriculation déjà existante, champ obligatoire vide).';
            
            // Tenter d'extraire le message d'erreur du serveur s'il est plus précis
            if (error.error && (error.error.error || error.error.message)) {
              const serverMessage = error.error.error || error.error.message;
              detail = `Erreur de Validation : ${serverMessage}`;
            }
          } else if (error.status === 401 || error.status === 403) {
            // Erreur d'autorisation
            detail = 'Accès refusé. Vous n\'avez pas les permissions pour enregistrer des véhicules.';
          } else if (error.status === 0) {
            // Erreur de réseau ou serveur injoignable
            detail = 'Erreur de connexion : Impossible de communiquer avec le serveur.';
          } else if (error.error && (error.error.error || error.error.message)) {
            // Message d'erreur général du serveur
            detail = `Erreur Serveur: ${error.error.error || error.error.message}`;
          }

          // Message final clair
          Swal.fire({
            title: 'Erreur',
            text: 'L\'enregistrement des véhicules a échoué.\n\nDétails : ${detail}\n\nSi le problème persiste, veuillez contacter le support technique.',
            icon: 'error',
            confirmButtonText: 'Réessayer',
            confirmButtonColor: '#d33'
          });
        }
      );
    } else {
      if (spinner) spinner.classList.add('d-none');
      this.markFormGroupTouched(this.addVehicule);
      Swal.fire({
            title: 'Erreur',
            text: 'Désolé, le formulaire n\'est pas bien renseigné',
            icon: 'error',
            confirmButtonText: 'Réessayer',
            confirmButtonColor: '#d33'
          });
      console.log('Formulaire Véhicules invalide.');
    }
  }

  // Fonction utilitaire pour convertir NgbDateStruct en string "YYYY-MM-DD"
  private ngbDateToString(ngbDate: any): string | null {
    if (!ngbDate || !ngbDate.year || !ngbDate.month || !ngbDate.day) return null;

    const year = ngbDate.year;
    const month = ngbDate.month.toString().padStart(2, '0'); // 01, 02 ...
    const day = ngbDate.day.toString().padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  onClickSubmitEditVehicule() {
    console.log('onClickSubmitEditVehicule appelé. Valeur du formulaire:', this.editVehicule.value);

    if (this.isEditingVehicule) {
      console.warn('Modification déjà en cours. Annulation.');
      return;
    }

    const spinner = document.querySelector('.spinnerModif');

    if (this.editVehicule.valid) {
      this.isEditingVehicule = true;
      if (spinner) spinner.classList.remove('d-none');

      // 1. Définir les variables pour le calcul
      const dateMiseEnServiceFormatted = this.formatDate(this.editVehicule.value.date_mise_en_service);
      // Utiliser la valeur du formulaire, ou 5 par défaut si elle est nulle/vide
      const nbreannee = this.editVehicule.value.nbreannee_amortissement || 5;
      const code = this.editVehicule.value.code;

      //this.editVehicule.value.date_acquisition
      const date_acquisitionNgb = this.editVehicule.value.date_acquisition;
      const date_acquisitionFormatted = this.ngbDateToString(date_acquisitionNgb);

      // 2. Calculer la date d'amortissement
      const dateAmortissementCalculee = this.calculerDateAmortissement(dateMiseEnServiceFormatted, nbreannee);

      const formData = {
        ...this.editVehicule.value,
        date_acquisition: date_acquisitionFormatted,
        date_mise_en_service: this.formatDate(this.editVehicule.value.date_mise_en_service),

      // Champs mis à jour/calculés :
      //date_mise_en_service: dateMiseEnServiceFormatted,
      date_amortissement : dateAmortissementCalculee,
      nbreannee_amortissement: nbreannee ,// Assurez-vous que cette clé est bien celle attendue par le backend



      };
      console.log('Envoi de la modification pour Vehicule:', formData);
      this.vehiculeService.editVehicule(formData).subscribe(
        (data: any) => {
          this.loadVehicules();
          if (spinner) spinner.classList.add('d-none');
          this.editVehicule.reset();
          this.isEditingVehicule = false;

          this.modalService.dismissAll(); // Utilisation de NgbModal pour fermer

          setTimeout(() => {
            this.alertModifVisible = true;
            console.log('Alert visible après fermeture du modal:', this.alertModifVisible);

            setTimeout(() => {
              this.alertModifVisible = false;
            }, 2000);
          }, 200);
        },
        (error: any) => {
                    console.error('Erreur lors de la modification du Vehicule :', error);
                    if (spinner) spinner.classList.add('d-none');
                    this.isEditingVehicule = false;
                    
                    // --- Logique d'affichage du message améliorée ---
                    let detail = 'Veuillez vérifier les informations de modification et réessayer.';
          
                    if (error.status === 422) {
                      // Erreur de validation (champs obligatoires, doublon de plaque, format)
                      detail = 'Erreur de Validation : Certaines informations sont manquantes ou incorrectes (ex. la nouvelle plaque d\'immatriculation est déjà utilisée).';
                      
                      // Tenter d'extraire le message d'erreur du serveur s'il est plus précis
                      if (error.error && (error.error.error || error.error.message)) {
                        const serverMessage = error.error.error || error.error.message;
                        detail = `Erreur de Validation : ${serverMessage}`;
                      }
                    } else if (error.status === 404) {
                      // Véhicule introuvable
                      detail = 'Le véhicule que vous tentez de modifier est introuvable. Il a peut-être été supprimé par un autre utilisateur.';
                    } else if (error.status === 401 || error.status === 403) {
                      // Erreur d'autorisation
                      detail = 'Accès refusé. Vous n\'avez pas les permissions pour modifier ce véhicule.';
                    } else if (error.status === 0) {
                      // Erreur de réseau
                      detail = 'Erreur de connexion : Impossible de communiquer avec le serveur pour enregistrer la modification.';
                    } else if (error.error && (error.error.error || error.error.message)) {
                      // Message d'erreur général du serveur
                      detail = `Erreur Serveur: ${error.error.error || error.error.message}`;
                    }
          
                    // Message final clair
                    Swal.fire({
                      title: 'Erreur',
                      text: 'La modification du véhicule a échoué.\n\nDétails : ${detail}\n\nSi le problème persiste, veuillez contacter le support technique.',
                      icon: 'error',
                      confirmButtonText: 'Réessayer',
                      confirmButtonColor: '#d33'
                    });
                  }
                );
    } else {
      if (spinner) spinner.classList.add('d-none');
      this.isEditingVehicule = false;
      this.markFormGroupTouched(this.editVehicule);
      Swal.fire({
            title: 'Erreur',
            text: 'Désolé, le formulaire n\'est pas bien renseigné',
            icon: 'error',
            confirmButtonText: 'Réessayer',
            confirmButtonColor: '#d33'
          });
    }
  }

  onClickSubmitDeleteVehicule() {
    console.log('onClickSubmitDeleteVehicule appelé. isDeletingVehicule:', this.isDeletingVehicule);

    if (this.isDeletingVehicule) {
      console.warn('Soumission de suppression multiple détectée. Annulation.');
      return;
    }

    const spinner = document.querySelector('.spinnerDelete');

    if (this.deleteVehicule.valid) {
      this.isDeletingVehicule = true;
      console.log('isDeletingVehicule mis à true.');
      if (spinner) spinner.classList.remove('d-none');

      const vehiculeIdToDelete = this.deleteVehicule.value.id;
      console.log('ID du véhicule à supprimer:', vehiculeIdToDelete);

      this.vehiculeService.deleteVehicule(this.deleteVehicule.value).subscribe(
        (data: any) => {
          console.log('Réponse de suppression:', data);
          this.loadVehicules();
          if (spinner) spinner.classList.add('d-none');
          this.deleteVehicule.reset();
          this.isDeletingVehicule = false;
          console.log('Suppression réussie. isDeletingVehicule mis à false.');

          this.modalService.dismissAll(); // Utilisation de NgbModal pour fermer

          setTimeout(() => {
            this.alertSuppVisible = true;
            console.log('Alert de suppression visible après fermeture du modal:', this.alertSuppVisible);

            setTimeout(() => {
              this.alertSuppVisible = false;
            }, 2000);
          }, 200);
        },
        (error: any) => {
          console.error('Erreur lors de la suppression du Vehicule :', error);
          if (spinner) spinner.classList.add('d-none');
          this.isDeletingVehicule = false;
          console.error('Suppression échouée. isDeletingVehicule mis à false.');
          Swal.fire({
            title: 'Erreur',
            text: 'Une erreur s\'est produite lors de la suppression: ${error.message || "Veuillez réessayer."}',
            icon: 'error',
            confirmButtonText: 'Réessayer',
            confirmButtonColor: '#d33'
          });
        }
      );
    } else {
      if (spinner) spinner.classList.add('d-none');
      this.isDeletingVehicule = false;
      Swal.fire({
            title: 'Erreur',
            text: 'Désolé, le formulaire de suppression n\'est pas bien renseigné (ID manquant).',
            icon: 'error',
            confirmButtonText: 'Réessayer',
            confirmButtonColor: '#d33'
          });
      console.warn('Formulaire de suppression invalide.');
    }
  }

  markFormGroupTouched(formGroup: FormGroup | FormArray) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();

      if (control instanceof FormGroup || control instanceof FormArray) {
        this.markFormGroupTouched(control);
      }
    });
  }

  loadModeles(): void {
    this.vehiculeService.getAllModeles().subscribe({
      next: (data) => {
        this.modeles = data;
      },
      error: (err) => {
        console.error("Erreur lors du chargement des modeles :", err);
      }
    });
  }

  loadMarques(): void {
    this.vehiculeService.getAllMarques().subscribe({
      next: (data) => {
        this.marques = data;
      },
      error: (err) => {
        console.error("Erreur lors du chargement des marques :", err);
      }
    });
  }

  loadVehicules(): void {
    this.loadingIndicator = true;
    this.vehiculeService.getAllVehicules().subscribe(
      (data: Vehicule[]) => {
        this.temp = [...data];
        this.rows = data;
        this.loadingIndicator = false;
        console.log('Véhicules chargés avec succès:', data.length);
      },
      error => {
        console.error('Erreur lors du chargement des Véhicules', error);
        this.loadingIndicator = false;
      }
    );
  }

  updateFilter(event: KeyboardEvent): void {
    const val = (event.target as HTMLInputElement).value.toLowerCase();

    this.rows = this.temp.filter(vehicule =>
      vehicule.immatriculation.toLowerCase().includes(val) ||
      (vehicule.numero_chassis && vehicule.numero_chassis.toLowerCase().includes(val)) ||
      // (vehicule.date_mise_en_service && String(vehicule.date_mise_en_service).toLowerCase().includes(val)) ||
      (vehicule.date_mise_en_service && String(vehicule.date_mise_en_service).toLowerCase().includes(val)) ||
      (vehicule.marque && vehicule.marque.libelle && vehicule.marque.libelle.toLowerCase().includes(val)) ||
      // (vehicule.kilometrage && vehicule.kilometrage && vehicule.kilometrage) ||
      (vehicule.kilometrage && String(vehicule.kilometrage).toLowerCase().includes(val)) ||
      (vehicule.modele && vehicule.modele.libelle_modele && vehicule.modele.libelle_modele.toLowerCase().includes(val))
    );

    this.table.offset = 0;
  }

  getEditForm(row: any) {
    console.log("Row reçu dans getEditForm :", row);
    this.editVehicule.patchValue({
      id: row.id,
      code: row.code,
      marque_id: row.marque_id,
      modele_id: row.modele_id,
      immatriculation: row.immatriculation,
      numero_chassis: row.numero_chassis,
      kilometrage: row.kilometrage,
      date_mise_en_service: this.convertToNgbDate(row.date_mise_en_service),
      puissance: row.puissance, // Ajouté
      places_assises: row.places_assises, // Ajouté
      energie: row.energie, // Ajouté
      nbreannee_amortissement: row.nbreannee_amortissement,
      date_amortissement: this.formatDateUpdate(row.date_amortissement),
      id_sous_type_immo: row.id_sous_type_immo ?? row.sous_type_immo?.id,
      id_groupe_type_immo: row.id_groupe_type_immo ?? row.groupe_type_immo?.id,
      //
      montant_ttc: row.montant_ttc,
      taux_ammortissement: row.taux_ammortissement,
      date_acquisition: this.convertToNgbDate(row.date_acquisition),
      observation: row.observation,
      bureau_id: row.bureau_id,
      fournisseur_id: row.fournisseur_id,
      etat: row.etat,
      id_status_immo: row.id_status_immo,
    });
    this.modalService.open(this.editVehiculeContent, { centered: true });
  }

  sendCarteGrise(row: any) {
    this.carteGrise.patchValue({
      id: row.id,
    });
    this.modalService.open(this.carteGriseContent, { centered: true });
  }

  getDeleteForm(row: any) {
    console.log('getDeleteForm appelé pour ID:', row.id);
    this.deleteVehicule.patchValue({
      id: row.id,
    });
    console.log('Formulaire deleteVehicule patché avec ID:', this.deleteVehicule.value.id);
    this.modalService.open(this.deleteVehiculeContent, { centered: true });
  }

   formatDate(date: NgbDateStruct): string {
    if (!date) return '';
    const year = date.year;
    const month = date.month.toString().padStart(2, '0');
    const day = date.day.toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  formatDateUpdate(dateString: string): string | null {
  if (!dateString) return null;
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = ('0' + (date.getMonth() + 1)).slice(-2);
  const day = ('0' + date.getDate()).slice(-2);
  return `${year}-${month}-${day}`; // ✅ format yyyy-MM-dd
}


  // Dans vehicules.component.ts

  convertToNgbDate(dateString: string): NgbDateStruct | null {
    if (!dateString) return null;
    const parts = dateString.split('-');
    if (parts.length === 3 && !isNaN(Number(parts[0])) && !isNaN(Number(parts[1])) && !isNaN(Number(parts[2]))) {
      return {
        year: +parts[0],
        month: +parts[1],
        day: +parts[2],
      };
    }
    console.warn('Format de date invalide pour convertToNgbDate:', dateString);
    return null;
  }

  downloadListeVehiculesPDF(): void {
    this.vehiculeService.imprimerVehicule().subscribe(
      (response: Blob) => {
        const fileURL = window.URL.createObjectURL(response);
        const a = document.createElement('a');
        a.href = fileURL;
        a.download = 'liste_vehicules.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(fileURL);
      },
      error => {
        console.error('Erreur lors du téléchargement du PDF de la liste des vehicules:', error);
        Swal.fire({
            title: 'Erreur',
            text: 'Impossible de télécharger le PDF. Veuillez vérifier votre connexion ou contacter l\'administrateur.',
            icon: 'error',
            confirmButtonText: 'Réessayer',
            confirmButtonColor: '#d33'
          });
      }
    );
  }

  /**
   * Gère la sélection du fichier Excel par l'utilisateur.
   * @param event L'événement de changement du champ input de type 'file'.
   */
  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      console.log('Fichier sélectionné:', this.selectedFile.name);
    } else {
      this.selectedFile = null;
    }
  }

  onClickSubmitCarteGrise(modal: any) {
  if (!this.selectedFile) {
    Swal.fire({
            title: 'Erreur',
            text: 'Veuillez sélectionner un fichier avant de valider.',
            icon: 'error',
            confirmButtonText: 'Réessayer',
            confirmButtonColor: '#d33'
          });
    return;
  }

  const formData = new FormData();
  // formData.append('id', this.carteGrise.value.id);
  formData.append('carte_grise', this.selectedFile);

  this.vehiculeService.uploadCarteGrise(this.carteGrise.value.id,formData).subscribe(
    (res: any) => {
      console.log("Carte grise ajoutée avec succès :", res);
      modal.close();
      this.selectedFile = null;
      this.loadVehicules();
    },
    (err: any) => {
      console.error("Erreur lors de l'ajout de la carte grise :", err);
      Swal.fire({
            title: 'Erreur',
            text: 'Erreur lors de l\'upload de la carte grise.',
            icon: 'error',
            confirmButtonText: 'Réessayer',
            confirmButtonColor: '#d33'
          });
      this.loadVehicules();
    }
  );
}

  /**
   * Envoie le fichier Excel sélectionné au backend pour importation.
   */
  uploadExcelFile(): void {
      if (!this.selectedFile) {
          // 1. Remplacement du premier alert
          const modal = document.getElementById('importVehiculesExcel');
          const bsModal = bootstrap.Modal.getInstance(modal);
          bsModal?.hide();
          this.showToast('warning', 'Sélection de Fichier', 'Veuillez sélectionner un fichier Excel à importer.');
          return;
      }

      this.isImporting = true;
      const spinner = document.querySelector('.spinner-import-vehicule');
      if (spinner) {
          spinner.classList.remove('d-none');
      }

      const formData = new FormData();
      formData.append('file', this.selectedFile, this.selectedFile.name);

      this.vehiculeService.importVehicules(formData).subscribe({
          next: (response: any) => {
              console.log('Importation réussie:', response);
              this.loadVehicules();
              this.isImporting = false;
              if (spinner) {
                  spinner.classList.add('d-none');
              }

              // Fermer le modal d'importation
              const modal = document.getElementById('importVehiculesExcel');
              const bsModal = bootstrap.Modal.getInstance(modal);
              bsModal?.hide();

              // ⚠️ On supprime la logique obsolète de setTimeout et alertImportVisible ⚠️
              // setTimeout(() => { ... });

              // 2. Remplacement du deuxième alert (Succès/Partiel)
              if (response.ignored && response.ignored.length > 0) {
                  // Succès partiel (utilise 'warning' pour le toast)
                  this.ignoredLines = response.ignored; // Stocke pour l'affichage détaillé dans le Toast HTML
                  this.showToast(
                      'black',
                      'Importation Partielle',
                      response.message + '. Veuillez consulter les lignes ignorées.'
                  );
              } else {
                  // Succès total (utilise 'success' pour le toast)
                  this.ignoredLines = [];
                  this.showToast(
                      'success',
                      'Importation Réussie !',
                      response.message || 'Tous les véhicules ont été importés avec succès.'
                  );
              }

              this.selectedFile = null;
              const fileInput = document.getElementById('excelFile') as HTMLInputElement;
                if (fileInput) {
                    fileInput.value = ''; // important pour pouvoir re-sélectionner le même fichier
                }
          },
          error: (error) => {
              console.error('Erreur lors de l\'importation des véhicules:', error);
              this.isImporting = false;
              if (spinner) {
                  spinner.classList.add('d-none');
              }

              // 3. Remplacement du troisième alert (Erreur)
              let errorMessage = 'Une erreur est survenue lors de l\'importation. Veuillez vérifier le fichier et réessayer.';
              let errorTitle = 'Erreur Générale';

              if (error.error && error.error.errors) {
                  // Erreurs de validation
                  let validationErrors = [];
                  for (const key in error.error.errors) {
                      if (error.error.errors.hasOwnProperty(key)) {
                          validationErrors.push(error.error.errors[key].join(', '));
                      }
                  }
                  errorMessage = 'Le fichier contient des erreurs de validation : ' + validationErrors.join('; ');
                  errorTitle = 'Erreur de Validation (422)';

              } else if (error.error && error.error.error) {
                  // Message d'erreur général
                  errorMessage = error.error.error;
                  errorTitle = 'Erreur Critique du Serveur';
              }

              this.ignoredLines = [];
              this.showToast('danger', errorTitle, errorMessage); // Utilise 'danger' pour le toast
          }
      });
  }

    calculerDateAmortissement(dateMiseEnService: string, duree: number): string {
    const date = new Date(dateMiseEnService);
    date.setFullYear(date.getFullYear() + duree);

    // Format yyyy-MM-dd (pour input type="date")
    return date.toISOString().split('T')[0];
  }

/*   private updateDateAmortissement(): void {
    const dateMiseEnService = this.editVehicule.get("date_mise_en_service")?.value;
    const nbreAnnees = this.editVehicule.get("nbreannee_amortissement")?.value;

    const dateAmortissementControl = this.editVehicule.get("date_amortissement");

    if (dateMiseEnService && nbreAnnees && Number(nbreAnnees) > 0) {
      const parts = dateMiseEnService.split('-');
      // Construction de la date locale pour éviter les problèmes de fuseau horaire
      const date = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));

      if (isNaN(date.getTime())) {
          dateAmortissementControl?.patchValue("Date Invalide", { emitEvent: false });
          return;
      }

      // Calcul de la nouvelle année
      date.setFullYear(date.getFullYear() + Number(nbreAnnees));

      // Reformatage en YYYY-MM-DD
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const dateAmortissement = `${year}-${month}-${day}`;

      // Mise à jour du formControl sans émettre d'événement
      dateAmortissementControl?.patchValue(dateAmortissement, { emitEvent: false });
    } else {
        // Vide le champ si les données sont manquantes ou incorrectes
        dateAmortissementControl?.patchValue('', { emitEvent: false });
    }
  } */

// vehicules.component.ts

private updateDateAmortissement(): void {
  const dateMiseEnServiceValue = this.editVehicule.get("date_mise_en_service")?.value;
  const nbreAnnees = this.editVehicule.get("nbreannee_amortissement")?.value;
  const dateAmortissementControl = this.editVehicule.get("date_amortissement");
  const date_acquisition = this.editVehicule.get("date_amortissement");
  console.log("date_acqui 1", date_acquisition);
  const date_acquisition_Formatted = this.convertToNgbDate(date_acquisition?.value);
  console.log("date_acqui 2 format", date_acquisition_Formatted);

  if (dateMiseEnServiceValue && nbreAnnees && Number(nbreAnnees) > 0) {

      // ⭐ ÉTAPE CLÉ : Convertir la valeur du Form Control (Objet ou String) en String YYYY-MM-DD
      const dateMiseEnServiceFormatted = this.formatDate(dateMiseEnServiceValue);
      

      // Vérification de sécurité au cas où formatDate renverrait null
      if (!dateMiseEnServiceFormatted) {
          dateAmortissementControl?.patchValue('', { emitEvent: false });
          return;
      }

      // Utiliser la fonction de calcul existante (qui prend maintenant une chaîne formatée)
      const dateAmortissement = this.calculerDateAmortissement(dateMiseEnServiceFormatted, Number(nbreAnnees));

      // Mettre à jour le champ 'date_amortissement'
      dateAmortissementControl?.patchValue(dateAmortissement, { emitEvent: false });
  } else {
      // Vider si les données ne sont pas complètes
      dateAmortissementControl?.patchValue('', { emitEvent: false });
  }
}

// NOTE : Votre fonction this.formatDate doit être capable de gérer l'objet NgbDateStruct
// et le convertir en string "YYYY-MM-DD".

onSousTypeChange(sousType: any) {
  this.selectedSousCompte = sousType ? String(sousType.compte) : '0';
}
onGroupeTypeChange(groupeType: any) {
  this.selectedGroupeCompte = groupeType ? String(groupeType.compte) : '0';
}


  private updateDateAmortissementForGroup(group: FormGroup): void {
  let dateMiseEnService = group.get("date_mise_en_service")?.value;
  const nbreAnnees = group.get("nbreannee_amortissement")?.value;

  console.log('updateDateAmortissementForGroup called', dateMiseEnService, nbreAnnees);

  let date: Date | null = null;

  if (dateMiseEnService) {
    // Si c'est un objet NgbDateStruct {year, month, day}
    if (typeof dateMiseEnService === 'object') {
      date = new Date(dateMiseEnService.year, dateMiseEnService.month - 1, dateMiseEnService.day);
    } else if (typeof dateMiseEnService === 'string') {
      const parts = dateMiseEnService.split('-');
      date = new Date(+parts[0], +parts[1] - 1, +parts[2]);
    }
  }

  if (date && nbreAnnees && Number(nbreAnnees) > 0 && !isNaN(date.getTime())) {
    date.setFullYear(date.getFullYear() + Number(nbreAnnees));

    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const dateAmortissement = `${year}-${month}-${day}`;

    const ctrl = group.get("date_amortissement");
    ctrl?.enable({ emitEvent: false });
    ctrl?.patchValue(dateAmortissement, { emitEvent: false });
    ctrl?.disable({ emitEvent: false });
  } else {
    const ctrl = group.get("date_amortissement");
    ctrl?.enable({ emitEvent: false });
    ctrl?.patchValue('', { emitEvent: false });
    ctrl?.disable({ emitEvent: false });
  }

  }

  private setupAmortissementListeners(): void {
    // ❌ AVANT: 'edit_date_mise_en_service'
    // ✅ APRÈS : 'date_mise_en_service'
    const dateMiseEnServiceControl = this.editVehicule.get('date_mise_en_service');

    // ❌ AVANT: 'edit_nbreannee_amortissement'
    // ✅ APRÈS : 'nbreannee_amortissement'
    const nbreAnneesControl = this.editVehicule.get('nbreannee_amortissement');

    // Le reste du code est correct une fois les contrôles trouvés
    if (dateMiseEnServiceControl) {
        dateMiseEnServiceControl.valueChanges.subscribe(() => {
            this.updateDateAmortissement();
        });
    }

    if (nbreAnneesControl) {
        nbreAnneesControl.valueChanges.subscribe(() => {
            this.updateDateAmortissement();
        });
    }
}

  showToast(type: 'success' | 'danger' | 'warning'| 'black', title: string, message: string): void {
    this.toastType = type;
    this.toastTitle = title;
    this.toastMessage = message;
    this.toastVisible = true;

    // Masquer le toast automatiquement après 5 secondes
    setTimeout(() => {
      this.toastVisible = false;
      this.ignoredLines = [];
    }, 5000);
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

  loadBureaux(): void {
    this.immobilisationService.getAllBureaux().subscribe({
      next: (data) => {
        this.bureaux = data;
      },
      error: (err) => {
        console.error("Erreur lors du chargement des bureaux :", err);
      }
    });
  }

  loadStatusImmo(): void {
    this.immobilisationService.getAllStatusImmos().subscribe({
      next: (data) => {
        // 🔹 Statuts à exclure
        const excluded = ['En service', 'En magasin', 'Sortie de patrimoine'];
        
        // 🔹 On filtre les statuts
        this.statusImmo = data.filter(status => !excluded.includes(status.libelle_status_immo));
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

}
