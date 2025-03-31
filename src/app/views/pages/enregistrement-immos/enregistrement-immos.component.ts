import { Component, ViewChild, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ColumnMode, DatatableComponent, NgxDatatableModule } from '@siemens/ngx-datatable';
import { ImmobilisationsService } from '../../../core/services/enregistrement-immos/enregistrement-immos.service';
import { Immobilisation, Fournisseur, StatusImmo, SousTypeImmo, GroupeTypeImmo, Vehicule } from '../../../core/services/interface/models';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from "@angular/forms";
import { CommonModule } from '@angular/common';
import { NgbAlertModule } from '@ng-bootstrap/ng-bootstrap';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectComponent as MyNgSelectComponent } from '@ng-select/ng-select';
import { FeatherIconDirective } from '../../../core/feather-icon/feather-icon.directive';


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
    MyNgSelectComponent,
    FeatherIconDirective

  ],
  templateUrl: 'enregistrement-immos.component.html'
})
export class ImmobilisationComponent implements OnInit {

  rows: Immobilisation[] = [];
  temp: Immobilisation[] = [];
  loadingIndicator = true;
  reorderable = true;
  ColumnMode = ColumnMode;

  alertAjoutVisible: boolean = false;  // Pour gérer la visibilité de l'alerte ajout
  alertModifVisible: boolean = false;  // Pour gérer la visibilité de l'alerte mofid
  alertSuppVisible: boolean = false;  // Pour gérer la visibilité de l'alerte supp

  public addImmobilisation!: FormGroup;
  public editImmobilisation!: FormGroup;
  public deleteImmobilisation!: FormGroup;

  fournisseurs: Fournisseur[] = []; // Liste des types Fournisseurs
  vehicules: Vehicule[] = []; // Liste des types Vehicules
  statusImmo: StatusImmo[] = []; // Liste des StatusImmo
  sousTypeImmo: SousTypeImmo[] = []; // Liste des SousTypeImmo
  groupeTypeImmo: GroupeTypeImmo[] = []; // Liste des GroupeTypeImmo

  etatOptions: string[] = ['Bon', 'Usé', 'Défectueux', 'Irréparable'];


  @ViewChild('table') table!: DatatableComponent;

  constructor(private immobilisationService: ImmobilisationsService, private formBuilder: FormBuilder,) { }

  ngOnInit(): void {
    this.loadImmobilisations();
    this.loadFournisseurs();
    this.loadStatusImmo();
    this.loadSousTypeImmo();
    this.loadGroupeTypeImmo();
    this.loadVehicules();
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
  onClickSubmitAddImmobilisation() {
    console.log(this.addImmobilisation.value);
    const spinner = document.querySelector('.spinner-border');

    if (this.addImmobilisation.valid) {
      if (spinner) spinner.classList.remove('d-none');
      this.immobilisationService.saveImmobilisation(this.addImmobilisation.value).subscribe(
        (data: any) => {
          this.loadImmobilisations();
          if (spinner) spinner.classList.add('d-none');
          this.addImmobilisation.reset();
          this.addImmobilisation.patchValue({ isVehicule: 1 });

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
          console.error('Erreur lors de l\'ajout de la Categorie :', error);
          if (spinner) spinner.classList.add('d-none');
          alert('Une erreur s\'est produite. Veuillez réessayer.');
        }
      );
    } else {
      if (spinner) spinner.classList.add('d-none');
      alert("Désolé, le formulaire n'est pas bien renseigné");
    }
  }

  onClickSubmitEditImmobilisation() {
    console.log(this.editImmobilisation.value);
    const spinner = document.querySelector('.spinnerModif');

    if (this.editImmobilisation.valid) {
      if (spinner) spinner.classList.remove('d-none');
      const id = this.editImmobilisation.value.id;
      this.immobilisationService.editImmobilisation(this.editImmobilisation.value).subscribe(
        (data: any) => {
          this.loadImmobilisations();
          if (spinner) spinner.classList.add('d-none');
          this.editImmobilisation.reset();

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
          alert('Une erreur s\'est produite. Veuillez réessayer.');
        }
      );
    } else {
      if (spinner) spinner.classList.add('d-none');
      alert("Désolé, le formulaire n'est pas bien renseigné");
    }
  }

  onClickSubmitDeleteImmobilisation() {
    console.log(this.deleteImmobilisation.value);
    const spinner = document.querySelector('.spinnerDelete');

    if (this.deleteImmobilisation.valid) {
      if (spinner) spinner.classList.remove('d-none');
      this.immobilisationService.deleteImmobilisation(this.deleteImmobilisation.value).subscribe(
        (data: any) => {
          this.loadImmobilisations();
          if (spinner) spinner.classList.add('d-none');
          this.deleteImmobilisation.reset();

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
          alert('Une erreur s\'est produite. Veuillez réessayer.');
        }
      );
    } else {
      if (spinner) spinner.classList.add('d-none');
      alert("Désolé, le formulaire n'est pas bien renseigné");
    }
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
      date_acquisition: row.date_acquisition,
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




}


