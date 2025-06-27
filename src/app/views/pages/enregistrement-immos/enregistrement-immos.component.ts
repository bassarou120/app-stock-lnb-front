import { Component, ViewChild, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ColumnMode, DatatableComponent, NgxDatatableModule } from '@siemens/ngx-datatable';
import { ImmobilisationsService } from '../../../core/services/enregistrement-immos/enregistrement-immos.service';
import { Immobilisation, Fournisseur, StatusImmo, SousTypeImmo, GroupeTypeImmo, Vehicule } from '../../../core/services/interface/models';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule, FormArray } from "@angular/forms"; // Importez FormArray
import { CommonModule } from '@angular/common';
import { NgbAlertModule, NgbCalendar, NgbDateStruct, NgbDatepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectComponent as MyNgSelectComponent } from '@ng-select/ng-select';
import { FeatherIconDirective } from '../../../core/feather-icon/feather-icon.directive';

import { Router } from '@angular/router';

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
  templateUrl: 'enregistrement-immos.component.html'
})
export class ImmobilisationComponent implements OnInit {
  currentDate: NgbDateStruct = inject(NgbCalendar).getToday();

    // PROPRIÉTÉS POUR LA GESTION DES PERMISSIONS
  allowedFonctionnalites: string[] = [];
  canAddImmo: boolean = true;    // DÉFAUT À TRUE pour éviter les blocages
  canViewImmoEntries: boolean = true;    // DÉFAUT À TRUE pour éviter les blocages
  canAffectImmo: boolean = true;    // DÉFAUT À TRUE pour éviter les blocages
  canInvertImmo: boolean = true; // DÉFAUT À TRUE pour éviter les blocages
  canExportImmo: boolean = true; // DÉFAUT À TRUE pour éviter les blocages
  canModifyImmo: boolean = true; // DÉFAUT À TRUE pour éviter les blocages
  canDeleteImmo: boolean = true; // DÉFAUT À TRUE pour éviter les blocages
  hasPageAccess: boolean = true;  //  DÉFAUT À TRUE pour éviter les blocages

  rows: Immobilisation[] = [];
  temp: Immobilisation[] = [];
  loadingIndicator = true;
  reorderable = true;
  ColumnMode = ColumnMode;

  alertAjoutVisible: boolean = false;  // Pour gérer la visibilité de l'alerte ajout
  alertModifVisible: boolean = false;  // Pour gérer la visibilité de l'alerte mofid
  alertSuppVisible: boolean = false;  // Pour gérer la visibilité de l'alerte supp

  public addImmobilisation!: FormGroup;
  public editImmobilisation!: FormGroup;
  public deleteImmobilisation!: FormGroup;

  fournisseurs: Fournisseur[] = []; // Liste des types Fournisseurs
  vehicules: Vehicule[] = []; // Liste des types Vehicules
  statusImmo: StatusImmo[] = []; // Liste des StatusImmo
  sousTypeImmo: SousTypeImmo[] = []; // Liste des SousTypeImmo
  groupeTypeImmo: GroupeTypeImmo[] = []; // Liste des GroupeTypeImmo

  etatOptions: string[] = ['Bon', 'Usé', 'Défectueux', 'Irréparable'];

  // NOUVELLE PROPRIÉTÉ POUR GÉRER L'ÉTAT DE SOUMISSION
  isAddingImmobilisation: boolean = false; // Pour l'ajout d'une immobilisation

  @ViewChild('table') table!: DatatableComponent;

  constructor(private immobilisationService: ImmobilisationsService, private formBuilder: FormBuilder, private router: Router) { }

  ngOnInit(): void {

    // 🔥 INITIALISER LES PERMISSIONS EN PREMIER
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
      date_mouvement: [null,[]],
      fournisseur_id: [null, []],
      designation: ["", [Validators.required]],
      isVehicule: [0, [Validators.required]],
      vehicule_id: [null, []],
      code: ["", [Validators.required]],
      id_groupe_type_immo: [null, [Validators.required]],
      id_sous_type_immo: [null, [Validators.required]],
      duree_amorti: ["", [Validators.required]],
      etat: ["", [Validators.required]],
      taux_ammortissement: ["", [Validators.required]],
      duree_ammortissement: ["", [Validators.required]],
      date_acquisition: ["", [Validators.required]],
      date_mise_en_service: ["", []],
      observation: [""],
      id_status_immo: [null, [Validators.required]],
      montant_ttc: ["", [Validators.required]],
    });
    this.editImmobilisation = this.formBuilder.group({
      id: [0, [Validators.required]],
      bureau_id: [null, []],
      employe_id: [null, []],
      date_mouvement: [null,[]],
      fournisseur_id: [null, []],
      designation: ["", [Validators.required]],
      isVehicule: [0, [Validators.required]],
      vehicule_id: [null, []],
      code: ["", [Validators.required]],
      id_groupe_type_immo: [null, [Validators.required]],
      id_sous_type_immo: [null, [Validators.required]],
      duree_amorti: ["", [Validators.required]],
      etat: ["", [Validators.required]],
      taux_ammortissement: ["", [Validators.required]],
      duree_ammortissement: ["", [Validators.required]],
      date_acquisition: ["", [Validators.required]],
      date_mise_en_service: ["", []],
      observation: [""],
      id_status_immo: [null, [Validators.required]],
      montant_ttc: ["", [Validators.required]],
    });
    this.deleteImmobilisation = this.formBuilder.group({
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
      this.canAddImmo = allowedFonctionnalites.includes('Ajout immobilisation');
      this.canAffectImmo = allowedFonctionnalites.includes('Affectation Immobilisation');
      this.canInvertImmo = allowedFonctionnalites.includes('Intervention Immobilisation');
      this.canExportImmo = allowedFonctionnalites.includes('Exporter immobilisation');
      this.canModifyImmo = allowedFonctionnalites.includes('Modification immobilisation');
      this.canDeleteImmo = allowedFonctionnalites.includes('Suppression immobilisation');
      this.canViewImmoEntries= allowedFonctionnalites.includes('Voir les immobilisations');

      // 🔥 ACCÈS À LA PAGE : Si au moins une fonctionnalité de stock est autorisée
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

      // 🔥 SI AUCUN ACCÈS, REDIRIGER VERS LE DASHBOARD
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

      // 🔥 NOUVELLE MÉTHODE : Définir les permissions par défaut
  private setDefaultPermissions(): void {
    this.canAddImmo = true;
    this.canAffectImmo = true;
    this.canInvertImmo = true;
    this.canExportImmo = true;
    this.canModifyImmo = true;
    this.canDeleteImmo = true;

    this.hasPageAccess = true;
    console.log('✅ Permissions par défaut appliquées');
  }

  onClickSubmitAddImmobilisation() {

    if (!this.canAddImmo) {
      alert('Vous n\'avez pas l\'autorisation d\'ajouter une immobilisation.');
      return;
    }

    console.log('onClickSubmitAddImmobilisation appelé. isAddingImmobilisation:', this.isAddingImmobilisation);

    // AJOUT DE LA VÉRIFICATION POUR PRÉVENIR LES DOUBLES CLICS
    if (this.isAddingImmobilisation) {
      console.warn('Soumission multiple détectée pour Immobilisation. Annulation.');
      return; // Empêche l'exécution si déjà en cours
    }

    const spinner = document.querySelector('.spinner-add-immobilisation'); // Assurez-vous que ce sélecteur correspond à votre HTML

    if (this.addImmobilisation.valid) {
      this.isAddingImmobilisation = true; // Désactiver le bouton
      console.log('isAddingImmobilisation mis à true.');

      if (spinner) {
        spinner.classList.remove('d-none');
        console.log('Spinner Immobilisation affiché.');
      }

      const formData = {
        ...this.addImmobilisation.value,
        date_acquisition: this.formatDate(this.addImmobilisation.value.date_acquisition), // Convertir la date
      };
      this.immobilisationService.saveImmobilisation(formData).subscribe(
        (data: any) => {
          this.loadImmobilisations();
          if (spinner) spinner.classList.add('d-none');
          this.addImmobilisation.reset();
          this.addImmobilisation.patchValue({ isVehicule: 1 }); // Remettre la valeur par défaut si besoin
          this.isAddingImmobilisation = false; // Réactiver le bouton
          console.log('Soumission Immobilisation réussie. isAddingImmobilisation mis à false.');

          // Fermer le modal manuellement
          const modal = document.getElementById('add_immobilisation');
          // @ts-ignore - pour éviter les erreurs TypeScript
          const bsModal = bootstrap.Modal.getInstance(modal);
          bsModal?.hide();

          // Attendre que le modal soit fermé avant d'afficher l'alerte
          setTimeout(() => {
            this.alertAjoutVisible = true;
            console.log('Alert visible après fermeture du modal:', this.alertAjoutVisible);

            // Utilisation de la transition pour faire apparaitre l'alerte
            setTimeout(() => {
              this.alertAjoutVisible = false;
            }, 2000); // L'alerte disparaît après 2 secondes
          }, 200); // L'alerte apparaît 200ms après la fermeture du modal
        },
        (error: any) => {
          console.error('Erreur lors de l\'ajout de l\'Immobilisation :', error);
          if (spinner) spinner.classList.add('d-none');
          this.isAddingImmobilisation = false; // Réactiver le bouton en cas d'erreur
          console.error('Soumission Immobilisation échouée. isAddingImmobilisation mis à false.');
          alert('Une erreur s\'est produite. Veuillez réessayer.');
        }
      );
    } else {
      if (spinner) spinner.classList.add('d-none');
      this.markFormGroupTouched(this.addImmobilisation); // Marquer les champs comme touchés pour afficher les erreurs
      alert("Désolé, le formulaire n'est pas bien renseigné");
      console.log('Formulaire Immobilisation invalide.');
    }
  }

  onClickSubmitEditImmobilisation() {

    if (!this.canModifyImmo) {
      alert('Vous n\'avez pas l\'autorisation de modifier cette immobilisation.');
      return;
    }

    console.log(this.editImmobilisation.value);
    const spinner = document.querySelector('.spinnerModif'); // Assurez-vous que c'est le bon sélecteur

    // NOTE: Il serait bon d'avoir une propriété isEditingImmobilisation: boolean = false;
    // et de la gérer de la même manière que pour l'ajout.
    // this.isEditingImmobilisation = true; // Ajoutez ceci
    if (this.editImmobilisation.valid) {
      if (spinner) spinner.classList.remove('d-none');
      const id = this.editImmobilisation.value.id;
      const formData = {
        ...this.editImmobilisation.value,
        date_acquisition: this.formatDate(this.editImmobilisation.value.date_acquisition), // Convertir la date
      };
      this.immobilisationService.editImmobilisation(formData).subscribe(
        (data: any) => {
          this.loadImmobilisations();
          if (spinner) spinner.classList.add('d-none');
          this.editImmobilisation.reset();
          // this.isEditingImmobilisation = false; // Ajoutez ceci

          // Fermer le modal manuellement
          const modal = document.getElementById('edit_immobilisation');
          // @ts-ignore - pour éviter les erreurs TypeScript
          const bsModal = bootstrap.Modal.getInstance(modal);
          bsModal?.hide();

          // Attendre que le modal soit fermé avant d'afficher l'alerte
          setTimeout(() => {
            this.alertModifVisible = true;
            console.log('Alert visible après fermeture du modal:', this.alertModifVisible);

            // Utilisation de la transition pour faire apparaitre l'alerte
            setTimeout(() => {
              this.alertModifVisible = false;
            }, 2000); // L'alerte disparaît après 2 secondes
          }, 200); // L'alerte apparaît 200ms après la fermeture du modal
        },
        (error: any) => {
          console.error('Erreur lors de la modification de l\'Immobilisation :', error);
          if (spinner) spinner.classList.add('d-none');
          // this.isEditingImmobilisation = false; // Ajoutez ceci
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

    console.log(this.deleteImmobilisation.value);
    const spinner = document.querySelector('.spinnerDelete');

    // NOTE: Il serait bon d'avoir une propriété isDeletingImmobilisation: boolean = false;
    // et de la gérer de la même manière que pour l'ajout.
    // this.isDeletingImmobilisation = true; // Ajoutez ceci
    if (this.deleteImmobilisation.valid) {
      if (spinner) spinner.classList.remove('d-none');
      this.immobilisationService.deleteImmobilisation(this.deleteImmobilisation.value).subscribe(
        (data: any) => {
          this.loadImmobilisations();
          if (spinner) spinner.classList.add('d-none');
          this.deleteImmobilisation.reset();
          // this.isDeletingImmobilisation = false; // Ajoutez ceci

          // Fermer le modal manuellement
          const modal = document.getElementById('delete_immobilisation');
          // @ts-ignore - pour éviter les erreurs TypeScript
          const bsModal = bootstrap.Modal.getInstance(modal);
          bsModal?.hide();

          // Attendre que le modal soit fermé avant d'afficher l'alerte
          setTimeout(() => {
            this.alertSuppVisible = true;
            console.log('Alert visible après fermeture du modal:', this.alertSuppVisible);

            // Utilisation de la transition pour faire apparaitre l'alerte
            setTimeout(() => {
              this.alertSuppVisible = false;
            }, 2000); // L'alerte disparaît après 2 secondes
          }, 200); // L'alerte apparaît 200ms après la fermeture du modal
        },
        (error: any) => {
          console.error('Erreur lors de la supression de l\'Immobilisation :', error);
          if (spinner) spinner.classList.add('d-none');
          // this.isDeletingImmobilisation = false; // Ajoutez ceci
          alert('Une erreur s\'est produite. Veuillez réessayer.');
        }
      );
    } else {
      if (spinner) spinner.classList.add('d-none');
      alert("Désolé, le formulaire n'est pas bien renseigné");
    }
  }

  // Fonction utilitaire pour marquer tous les champs comme touchés (validation)
  markFormGroupTouched(formGroup: FormGroup | FormArray) { // Ajout de FormArray
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
        this.temp = [...data]; // Sauvegarde de la liste complète pour la recherche
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
      immo.designation.toLowerCase().includes(val)
    );

    this.table.offset = 0;
  }

  getEditForm(row: any) {
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
      duree_amorti: row.duree_amorti,
      etat: row.etat,
      taux_ammortissement: row.taux_ammortissement,
      duree_ammortissement: row.duree_ammortissement,
      date_acquisition: this.convertToNgbDate(row.date_acquisition),
      date_mise_en_service: row.date_mise_en_service,
      observation: row.observation,
      id_status_immo: row.id_status_immo,
      montant_ttc: row.montant_ttc,
    })
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
        this.fournisseurs = data; // Stocker la liste des fournisseurs
      },
      error: (err) => {
        console.error("Erreur lors du chargement des fournisseurs :", err);
      }
    });
  }

  loadVehicules(): void {
    this.immobilisationService.getAllVehicules().subscribe({
      next: (data) => {
        this.vehicules = data; // Stocker la liste des Vehicules
      },
      error: (err) => {
        console.error("Erreur lors du chargement des Vehicules :", err);
      }
    });
  }

  loadStatusImmo(): void {
    this.immobilisationService.getAllStatusImmos().subscribe({
      next: (data) => {
        this.statusImmo = data.filter(status => status.libelle_status_immo !== 'En service');; // Stocker la liste des StatusImmo
      },
      error: (err) => {
        console.error("Erreur lors du chargement des StatusImmo :", err);
      }
    });
  }

  loadSousTypeImmo(): void {
    this.immobilisationService.getAllSousTypeImmos().subscribe({
      next: (data) => {
        this.sousTypeImmo = data; // Stocker la liste des SousTypeImmo
      },
      error: (err) => {
        console.error("Erreur lors du chargement des SousTypeImmo :", err);
      }
    });
  }

  loadGroupeTypeImmo(): void {
    this.immobilisationService.getAllGroupeTypeImmos().subscribe({
      next: (data) => {
        this.groupeTypeImmo = data; // Stocker la liste des groupeTypeImmo
      },
      error: (err) => {
        console.error("Erreur lors du chargement des groupeTypeImmo :", err);
      }
    });
  }

  formatDate(date: NgbDateStruct): string {
    const year = date.year;
    const month = date.month.toString().padStart(2, '0'); // Ajoute un zéro devant si nécessaire
    const day = date.day.toString().padStart(2, '0');
    return `${year}-${month}-${day}`; // Format YYYY-MM-DD
  }


  // Méthode pour convertir "YYYY-MM-DD" en NgbDateStruct
  convertToNgbDate(dateString: string): NgbDateStruct | null {
    if (!dateString) return null;
    const parts = dateString.split('-'); // Séparer YYYY-MM-DD
    return {
      year: +parts[0],
      month: +parts[1],
      day: +parts[2],
    };
  }

  downloadImmosPDF(): void {

    if (!this.canExportImmo) {
      alert('Vous n\'avez pas l\'autorisation d\'exportr la liste des transferts.');
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
