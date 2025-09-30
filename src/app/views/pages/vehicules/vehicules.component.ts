import { Component, ViewChild, OnInit, inject, TemplateRef,ViewEncapsulation } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ColumnMode, DatatableComponent, NgxDatatableModule } from '@siemens/ngx-datatable';
import { VehiculeService } from '../../../core/services/vehicules/vehicules.service';
import { Vehicule, Modele, Marque } from '../../../core/services/interface/models';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule, FormArray } from "@angular/forms";
import { CommonModule } from '@angular/common';
import { NgbAlertModule, NgbCalendar, NgbDateStruct, NgbDatepickerModule, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { NgSelectComponent as MyNgSelectComponent } from '@ng-select/ng-select';
import { Router } from '@angular/router';
import { HttpEventType, HttpClient } from '@angular/common/http'; // Import HttpClient pour l'upload de fichier
import { environment } from "../../../../environments/environment";

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

  alertAjoutVisible: boolean = false;
  alertModifVisible: boolean = false;
  alertSuppVisible: boolean = false;
  alertImportVisible: boolean = false; // Nouvelle alerte pour l'import

  public addVehicule!: FormGroup;
  public editVehicule!: FormGroup;
  public carteGrise!: FormGroup;
  public deleteVehicule!: FormGroup;

  isAddingVehicules: boolean = false;
  isDeletingVehicule: boolean = false;
  isEditingVehicule: boolean = false;
  isImporting: boolean = false; // Nouvelle propriété pour l'état d'importation
  selectedFile: File | null = null; // Pour stocker le fichier sélectionné

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
    private http: HttpClient // Injecter HttpClient
  ) { }

  ngOnInit(): void {
    this.initializePermissions();
    if (this.hasPageAccess) {
      this.loadMarques();
      this.loadModeles();
      this.loadVehicules();
      this.initForm();
    }

    this.editVehicule = this.formBuilder.group({
      id: [0, [Validators.required]],
      marque_id: [null, [Validators.required]],
      modele_id: [null, [Validators.required]],
      immatriculation: ["", [Validators.required, Validators.pattern(/^[A-Z0-9\s-]+$/)]],
      numero_chassis: [""],
      puissance: [""],
      places_assises: [0],
      energie: [""],
      kilometrage: [0, [Validators.required, Validators.min(0)]],
      date_mise_en_service: ["", [Validators.required]],
      nbreannee_amortissement: [5, [Validators.min(1)]], // Valeur par défaut à 5 ans
      date_amortissement: [""],
    });
    this.deleteVehicule = this.formBuilder.group({
      id: [null, [Validators.required]],
    });
    this.carteGrise = this.formBuilder.group({
      id: [null, [Validators.required]],
    });
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
  }

  get vehiculesArray(): FormArray {
    return this.addVehicule.get('vehicules') as FormArray;
  }

  createVehiculeFormGroup(): FormGroup {
    return this.formBuilder.group({
      marque_id: [null, [Validators.required]],
      modele_id: [null, [Validators.required]],
      immatriculation: ["", [Validators.required, Validators.pattern(/^[A-Z0-9\s-]+$/)]],
      numero_chassis: [""],
      kilometrage: [null, [Validators.required, Validators.min(0)]],
      date_mise_en_service: ["", [Validators.required]],
      puissance: [""],
      places_assises: [null],
      energie: [""],
      nbreannee_amortissement: [5, [Validators.min(1)]], // Valeur par défaut à 5 ans
      date_amortissement: [""],
    });
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
        return {
          ...vehicule,
          date_mise_en_service: this.formatDate(vehicule.date_mise_en_service)
        };
      });

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
          alert('Une erreur s\'est produite. Veuillez réessayer.');
        }
      );
    } else {
      if (spinner) spinner.classList.add('d-none');
      this.markFormGroupTouched(this.addVehicule);
      alert("Désolé, le formulaire n'est pas bien renseigné");
      console.log('Formulaire Véhicules invalide.');
    }
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
      const formData = {
        ...this.editVehicule.value,
        date_mise_en_service: this.formatDate(this.editVehicule.value.date_mise_en_service),
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
          alert('Une erreur s\'est produite. Veuillez réessayer.');
        }
      );
    } else {
      if (spinner) spinner.classList.add('d-none');
      this.isEditingVehicule = false;
      this.markFormGroupTouched(this.editVehicule);
      alert("Désolé, le formulaire n'est pas bien renseigné");
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
          alert(`Une erreur s'est produite lors de la suppression: ${error.message || 'Veuillez réessayer.'}`);
        }
      );
    } else {
      if (spinner) spinner.classList.add('d-none');
      this.isDeletingVehicule = false;
      alert("Désolé, le formulaire de suppression n'est pas bien renseigné (ID manquant).");
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
    this.editVehicule.patchValue({
      id: row.id,
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
      date_amortissement: this.convertToNgbDate(row.date_amortissement),
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
        alert('Impossible de télécharger le PDF. Veuillez vérifier votre connexion ou contacter l\'administrateur.');
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
    alert("Veuillez sélectionner un fichier avant de valider.");
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
      alert("Erreur lors de l'upload de la carte grise.");
      this.loadVehicules();
    }
  );
}

  /**
   * Envoie le fichier Excel sélectionné au backend pour importation.
   */
  uploadExcelFile(): void {
    if (!this.selectedFile) {
      alert('Veuillez sélectionner un fichier Excel à importer.');
      return;
    }

    this.isImporting = true;
    const spinner = document.querySelector('.spinner-import-vehicule'); // Assurez-vous d'avoir un spinner dans votre HTML pour l'import
    if (spinner) {
      spinner.classList.remove('d-none');
    }

    const formData = new FormData();
    formData.append('file', this.selectedFile, this.selectedFile.name);

    // Assurez-vous que l'URL correspond à votre route d'importation dans Laravel
    // Ex: 'http://localhost:8000/api/vehicules/import'
    this.vehiculeService.importVehicules(formData).subscribe({
      next: (response) => {
        console.log('Importation réussie:', response);
        this.loadVehicules(); // Recharger la liste des véhicules après l'import
        this.isImporting = false;
        if (spinner) {
          spinner.classList.add('d-none');
        }
        // Fermer le modal d'importation
        const modal = document.getElementById('importVehiculesExcel');
        const bsModal = bootstrap.Modal.getInstance(modal);
        bsModal?.hide();

        setTimeout(() => {
          this.alertImportVisible = true;
          setTimeout(() => {
            this.alertImportVisible = false;
          }, 2000);
        }, 200);
        alert('Véhicules importés avec succès !');
        this.selectedFile = null; // Réinitialiser le fichier sélectionné
      },
      error: (error) => {
        console.error('Erreur lors de l\'importation des véhicules:', error);
        this.isImporting = false;
        if (spinner) {
          spinner.classList.add('d-none');
        }
        let errorMessage = 'Une erreur est survenue lors de l\'importation. Veuillez vérifier le fichier et réessayer.';
        if (error.error && error.error.errors) {
          // Si Laravel renvoie des erreurs de validation
          errorMessage += '\nErreurs de validation:';
          for (const key in error.error.errors) {
            if (error.error.errors.hasOwnProperty(key)) {
              errorMessage += `\n- ${error.error.errors[key].join(', ')}`;
            }
          }
        } else if (error.error && error.error.error) {
          // Si Laravel renvoie un message d'erreur général (comme dans votre try-catch du contrôleur)
          errorMessage = error.error.error;
        }
        alert(errorMessage);
      }
    });
  }
}
