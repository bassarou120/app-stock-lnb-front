import { Component, ViewChild, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ColumnMode, DatatableComponent, NgxDatatableModule } from '@siemens/ngx-datatable';
import { VehiculeService } from '../../../core/services/vehicules/vehicules.service';
import { Vehicule, Modele, Marque } from '../../../core/services/interface/models';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule, FormArray } from "@angular/forms";
import { CommonModule } from '@angular/common';
import { NgbAlertModule, NgbCalendar, NgbDateStruct, NgbDatepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { NgSelectComponent as MyNgSelectComponent } from '@ng-select/ng-select';

// Importez FeatherIconDirective si vous l'utilisez, sinon retirez-la.
// Pour l'instant, je la retire car elle n'était pas présente dans l'import list du @Component
// mais était implicitement utilisée par la présence dans le fichier précédent.
// Si vous l'utilisez dans votre HTML pour les véhicules, ajoutez-la ici et dans `imports`.
// import { FeatherIconDirective } from '../../../core/feather-icon/feather-icon.directive';

declare var bootstrap: any;

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
  templateUrl: 'vehicules.component.html'
})

export class VehiculesComponent implements OnInit {

    // 🔥 PROPRIÉTÉS POUR LA GESTION DES PERMISSIONS
  allowedFonctionnalites: string[] = [];
  canAddVehicule: boolean = true;    // 🔥 DÉFAUT À TRUE pour éviter les blocages
  canViewVehicule: boolean = true;    // 🔥 DÉFAUT À TRUE pour éviter les blocages
  canModifyVehicule: boolean = true; // 🔥 DÉFAUT À TRUE pour éviter les blocages
  canDeleteVehicule: boolean = true; // 🔥 DÉFAUT À TRUE pour éviter les blocages
  hasPageAccess: boolean = true;  // 🔥 DÉFAUT À TRUE pour éviter les blocages

  currentDate: NgbDateStruct = inject(NgbCalendar).getToday();

  rows: Vehicule[] = [];
  temp: Vehicule[] = [];
  loadingIndicator = true;
  reorderable = true;
  ColumnMode = ColumnMode;

  modeles: Modele[] = []; // Liste des modeles
  marques: Marque[] = []; // Liste des marques

  alertAjoutVisible: boolean = false;  // Pour gérer la visibilité de l'alerte ajout
  alertModifVisible: boolean = false;  // Pour gérer la visibilité de l'alerte mofid
  alertSuppVisible: boolean = false;  // Pour gérer la visibilité de l'alerte supp

  public addVehicule!: FormGroup;
  public editVehicule!: FormGroup;
  public deleteVehicule!: FormGroup;

  // NOUVELLE PROPRIÉTÉ POUR GÉRER L'ÉTAT DE SOUMISSION MULTIPLE
  isAddingVehicules: boolean = false; // Pour l'ajout de plusieurs véhicules

  @ViewChild('table') table!: DatatableComponent;

  constructor(private vehiculeService: VehiculeService, private formBuilder: FormBuilder,) { }

  ngOnInit(): void {

    // 🔥 INITIALISER LES PERMISSIONS EN PREMIER
    this.initializePermissions();
    if (this.hasPageAccess) {
    this.loadMarques();
    this.loadModeles();
    this.loadVehicules();
    this.initForm(); // Initialise le formulaire d'ajout avec le FormArray
    }

    this.editVehicule = this.formBuilder.group({
      id: [0, [Validators.required]],
      marque_id: [null, [Validators.required]],
      modele_id: [null, [Validators.required]],
      immatriculation: ["", [Validators.required, Validators.pattern(/^[A-Z0-9\s-]+$/)]], // Validation de l'immatriculation
      numero_chassis: ["", [Validators.required]],
      kilometrage: [0, [Validators.required, Validators.min(0)]], // Ajout d'un validateur min(0)
      date_mise_en_service: ["", [Validators.required]],
    });
    this.deleteVehicule = this.formBuilder.group({
      id: [0, [Validators.required]],
    });
  }

  // 🔥 NOUVELLE MÉTHODE : Initialiser les permissions
  private initializePermissions(): void {
    try {
      const allowedFonctionnalitesStr = localStorage.getItem('allowedFonctionnalites');

      if (!allowedFonctionnalitesStr) {
        console.log('⚠️ Aucune fonctionnalité trouvée - Permissions par défaut');
        return; // Garder les permissions par défaut (true)
      }

      const allowedFonctionnalites: string[] = JSON.parse(allowedFonctionnalitesStr);
      console.log('📋 Fonctionnalités autorisées:', allowedFonctionnalites);

      // 🔥 VÉRIFICATION DES PERMISSIONS SPÉCIFIQUES
      this.canAddVehicule = allowedFonctionnalites.includes('Ajout vehicule');
      this.canModifyVehicule = allowedFonctionnalites.includes('Modification vehicule');
      this.canDeleteVehicule = allowedFonctionnalites.includes('Suppression vehicule');
      this.canViewVehicule = allowedFonctionnalites.includes('Voir parc vehicule');

      // 🔥 ACCÈS À LA PAGE : Si au moins une fonctionnalité de stock est autorisée
      this.hasPageAccess = this.canViewVehicule ;


      console.log('🔐 Permissions calculées:', {
        canAddVehicule: this.canAddVehicule,
        canModifyVehicule: this.canModifyVehicule,
        canDeleteVehicule: this.canDeleteVehicule
      });

      // 🔥 SI AUCUN ACCÈS, REDIRIGER VERS LE DASHBOARD
      if (!this.hasPageAccess) {
        console.warn('❌ Accès refusé à la page des entrées de stock');
        // Optionnel: redirection automatique
        // this.router.navigate(['/dashboard']);
      }

    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation des permissions:', error);
      // En cas d'erreur, garder les permissions par défaut (true)
    }
  }

  initForm(): void {
    this.addVehicule = this.formBuilder.group({
      vehicules: this.formBuilder.array([this.createVehiculeFormGroup()])
    });
  }
  // Getter pour accéder facilement au FormArray
  get vehiculesArray(): FormArray {
    return this.addVehicule.get('vehicules') as FormArray;
  }
  // Méthode pour créer un groupe de formulaire pour un seul vehicule
  createVehiculeFormGroup(): FormGroup {
    return this.formBuilder.group({
      marque_id: [null, [Validators.required]],
      modele_id: [null, [Validators.required]],
      immatriculation: ["", [Validators.required, Validators.pattern(/^[A-Z0-9\s-]+$/)]], // Validation de l'immatriculation
      numero_chassis: ["", [Validators.required]],
      kilometrage: [null, [Validators.required, Validators.min(0)]], // Changé en null initial, ajout min(0)
      date_mise_en_service: ["", [Validators.required]],
    });
  }
  // Ajouter un nouveau groupe de vehicule
  addNewVehicule(): void {
    this.vehiculesArray.push(this.createVehiculeFormGroup());
  }
  // Supprimer un vehicule
  removeVehicule(index: number): void {
    if (this.vehiculesArray.length > 1) { // Toujours laisser au moins un champ
      this.vehiculesArray.removeAt(index);
    }
  }

  onClickSubmitAddVehicules(): void {
    // console.log('onClickSubmitAddVehicules appelé. isAddingVehicules:', this.isAddingVehicules); // Commenté

    // AJOUT DE LA VÉRIFICATION POUR PRÉVENIR LES DOUBLES CLICS
    if (this.isAddingVehicules) {
      // console.warn('Soumission multiple détectée pour Véhicules. Annulation.'); // Commenté
      return; // Empêche l'exécution si déjà en cours
    }

    const spinner = document.querySelector('.spinner-add-vehicule'); // Assurez-vous que ce sélecteur correspond à votre HTML

    if (this.addVehicule.valid) {
      this.isAddingVehicules = true; // Désactiver le bouton
      // console.log('isAddingVehicules mis à true.'); // Commenté

      if (spinner) {
        spinner.classList.remove('d-none');
        // console.log('Spinner Véhicule affiché.'); // Commenté
      }

      const vehiculesToSave = this.vehiculesArray.value.map((vehicule: any) => {
        return {
          ...vehicule,
          // Formater la date de chaque véhicule individuellement
          date_mise_en_service: this.formatDate(vehicule.date_mise_en_service)
        };
      });

      // Créer un observable pour sauvegarder tous les Vehicule
      this.vehiculeService.saveMultipleVehicules(vehiculesToSave).subscribe(
        (data: any) => {
          this.loadVehicules();
          if (spinner) spinner.classList.add('d-none');
          this.initForm(); // Réinitialiser le formulaire avec un seul Vehicule vide
          this.isAddingVehicules = false; // Réactiver le bouton
          // console.log('Soumission Véhicules réussie. isAddingVehicules mis à false.'); // Commenté

          // Fermer le modal manuellement
          const modal = document.getElementById('add_vehicule');
          // @ts-ignore - pour éviter les erreurs TypeScript
          const bsModal = bootstrap.Modal.getInstance(modal);
          bsModal?.hide();

          // Attendre que le modal soit fermé avant d'afficher l'alerte
          setTimeout(() => {
            this.alertAjoutVisible = true;
            // console.log('Alert visible après fermeture du modal:', this.alertAjoutVisible); // Commenté

            // Utilisation de la transition pour faire apparaitre l'alerte
            setTimeout(() => {
              this.alertAjoutVisible = false;
            }, 2000); // L'alerte disparaît après 2 secondes
          }, 200); // L'alerte apparaît 200ms après la fermeture du modal
        },
        (error: any) => {
          console.error('Erreur lors de l\'ajout des Vehicules :', error);
          if (spinner) spinner.classList.add('d-none');
          this.isAddingVehicules = false; // Réactiver le bouton en cas d'erreur
          // console.error('Soumission Véhicules échouée. isAddingVehicules mis à false.'); // Commenté
          alert('Une erreur s\'est produite. Veuillez réessayer.');
        }
      );
    } else {
      if (spinner) spinner.classList.add('d-none');
      this.markFormGroupTouched(this.addVehicule); // Marquer les champs comme touchés pour afficher les erreurs
      alert("Désolé, le formulaire n'est pas bien renseigné");
      // console.log('Formulaire Véhicules invalide.'); // Commenté
    }
  }


  onClickSubmitEditVehicule() {
    // console.log(this.editVehicule.value); // Commenté
    const spinner = document.querySelector('.spinnerModif');

    // NOTE: Il serait bon d'avoir une propriété isEditingVehicule: boolean = false;
    // et de la gérer de la même manière que pour l'ajout.
    // this.isEditingVehicule = true; // Ajoutez ceci
    if (this.editVehicule.valid) {
      if (spinner) spinner.classList.remove('d-none');
      // const id = this.editVehicule.value.id; // Non utilisé, peut être supprimé
      const formData = {
        ...this.editVehicule.value,
        date_mise_en_service: this.formatDate(this.editVehicule.value.date_mise_en_service), // Convertir la date
      };
      this.vehiculeService.editVehicule(formData).subscribe(
        (data: any) => {
          this.loadVehicules();
          if (spinner) spinner.classList.add('d-none');
          this.editVehicule.reset();
          // this.isEditingVehicule = false; // Ajoutez ceci

          // Fermer le modal manuellement
          const modal = document.getElementById('edit_vehicule');
          // @ts-ignore - pour éviter les erreurs TypeScript
          const bsModal = bootstrap.Modal.getInstance(modal);
          bsModal?.hide();

          // Attendre que le modal soit fermé avant d'afficher l'alerte
          setTimeout(() => {
            this.alertModifVisible = true;
            // console.log('Alert visible après fermeture du modal:', this.alertModifVisible); // Commenté

            // Utilisation de la transition pour faire apparaitre l'alerte
            setTimeout(() => {
              this.alertModifVisible = false;
            }, 2000); // L'alerte disparaît après 2 secondes
          }, 200); // L'alerte apparaît 200ms après la fermeture du modal
        },
        (error: any) => {
          console.error('Erreur lors de la modification du Vehicule :', error);
          if (spinner) spinner.classList.add('d-none');
          // this.isEditingVehicule = false; // Ajoutez ceci
          alert('Une erreur s\'est produite. Veuillez réessayer.');
        }
      );
    } else {
      if (spinner) spinner.classList.add('d-none');
      this.markFormGroupTouched(this.editVehicule); // Marquer les champs comme touchés
      alert("Désolé, le formulaire n'est pas bien renseigné");
    }
  }

  onClickSubmitDeleteVehicule() {
    // console.log(this.deleteVehicule.value); // Commenté
    const spinner = document.querySelector('.spinnerDelete');

    // NOTE: Il serait bon d'avoir une propriété isDeletingVehicule: boolean = false;
    // et de la gérer de la même manière que pour l'ajout.
    // this.isDeletingVehicule = true; // Ajoutez ceci
    if (this.deleteVehicule.valid) {
      if (spinner) spinner.classList.remove('d-none');
      this.vehiculeService.deleteVehicule(this.deleteVehicule.value).subscribe(
        (data: any) => {
          this.loadVehicules();
          if (spinner) spinner.classList.add('d-none');
          this.deleteVehicule.reset();
          // this.isDeletingVehicule = false; // Ajoutez ceci

          // Fermer le modal manuellement
          const modal = document.getElementById('delete_vehicule');
          // @ts-ignore - pour éviter les erreurs TypeScript
          const bsModal = bootstrap.Modal.getInstance(modal);
          bsModal?.hide();

          // Attendre que le modal soit fermé avant d'afficher l'alerte
          setTimeout(() => {
            this.alertSuppVisible = true;
            // console.log('Alert visible après fermeture du modal:', this.alertSuppVisible); // Commenté

            // Utilisation de la transition pour faire apparaitre l'alerte
            setTimeout(() => {
              this.alertSuppVisible = false;
            }, 2000); // L'alerte disparaît après 2 secondes
          }, 200); // L'alerte apparaît 200ms après la fermeture du modal
        },
        (error: any) => {
          console.error('Erreur lors de la supression du Vehicule :', error);
          if (spinner) spinner.classList.add('d-none');
          // this.isDeletingVehicule = false; // Ajoutez ceci
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

  loadModeles(): void {
    this.vehiculeService.getAllModeles().subscribe({
      next: (data) => {
        this.modeles = data; // Stocker la liste des modeles
      },
      error: (err) => {
        console.error("Erreur lors du chargement des modeles :", err);
      }
    });
  }

  loadMarques(): void {
    this.vehiculeService.getAllMarques().subscribe({
      next: (data) => {
        this.marques = data; // Stocker la liste des marques
      },
      error: (err) => {
        console.error("Erreur lors du chargement des marques :", err);
      }
    });
  }


  loadVehicules(): void {
    this.vehiculeService.getAllVehicules().subscribe(
      (data: Vehicule[]) => {
        this.temp = [...data]; // Sauvegarde de la liste complète pour la recherche
        this.rows = data;
        this.loadingIndicator = false;
      },
      error => {
        console.error('Erreur lors du chargement des Véhicules', error);
        this.loadingIndicator = false;
      }
    );
  }

  // updateFilter(event: KeyboardEvent): void {
  //   const val = (event.target as HTMLInputElement).value.toLowerCase();

  //   this.rows = this.temp.filter(vehicule =>
  //     vehicule.immatriculation.toLowerCase().includes(val) ||
  //     vehicule.numero_chassis.toLowerCase().includes(val) ||
  //     vehicule.date_mise_en_service.toLowerCase().includes(val) ||
  //     // Vérifier si l'objet imbriqué existe avant d'accéder à ses propriétés
  //     (vehicule.marque && vehicule.marque.libelle_marque.toLowerCase().includes(val)) ||
  //     (vehicule.modele && vehicule.modele.libelle_modele.toLowerCase().includes(val))
  //   );

  //   this.table.offset = 0;
  // }
  updateFilter(event: KeyboardEvent): void {
    const val = (event.target as HTMLInputElement).value.toLowerCase();

    this.rows = this.temp.filter(vehicule =>
      vehicule.immatriculation.toLowerCase().includes(val)
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
    })
  }

  getDeleteForm(row: any) {
    this.deleteVehicule.patchValue({
      id: row.id,
    })
  }

  formatDate(date: NgbDateStruct): string {
    const year = date.year;
    const month = date.month.toString().padStart(2, '0'); // Ajoute un zéro devant si nécessaire
    const day = date.day.toString().padStart(2, '0');
    return `${year}-${month}-${day}`; // Format CCYY-MM-DD
  }


  // Méthode pour convertir "YYYY-MM-DD" en NgbDateStruct
  convertToNgbDate(dateString: string): NgbDateStruct | null {
    if (!dateString) return null;
    const parts = dateString.split('-'); // Séparer CCYY-MM-DD
    return {
      year: +parts[0],
      month: +parts[1],
      day: +parts[2],
    };
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

}
