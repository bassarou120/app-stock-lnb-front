import { Component, ViewChild, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ColumnMode, DatatableComponent, NgxDatatableModule } from '@siemens/ngx-datatable';
import { InterventionsVehiculeService } from '../../../core/services/interventionvehicules/interventionvehicules.service';
import { InterventionVehicule, TypeIntervention, Vehicule, Commune } from '../../../core/services/interface/models'; // Assurez-vous que le chemin est correct et que Commune est bien importée
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule, FormArray } from "@angular/forms"; // Ajout de FormArray
import { CommonModule } from '@angular/common';
import { NgbAlertModule, NgbCalendar, NgbDateStruct, NgbDatepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectComponent as MyNgSelectComponent } from '@ng-select/ng-select';
import { FeatherIconDirective } from '../../../core/feather-icon/feather-icon.directive';


declare var bootstrap: any;

@Component({
  selector: 'app-intervention-vehicule',
  standalone: true,
  imports: [
    RouterLink,
    NgxDatatableModule,
    ReactiveFormsModule,
    CommonModule,
    NgbAlertModule,
    NgbDropdownModule,
    MyNgSelectComponent,
    NgbDatepickerModule,
    FeatherIconDirective
  ],
  templateUrl: 'interventionvehicules.component.html'
})

export class InterventionVehiculeComponent implements OnInit {
  currentDate: NgbDateStruct = inject(NgbCalendar).getToday();

  rows: InterventionVehicule[] = []; // Utilisez l'interface InterventionVehicule
  temp: InterventionVehicule[] = [];
  loadingIndicator = true;
  reorderable = true;
  ColumnMode = ColumnMode;

  alertAjoutVisible: boolean = false;
  alertModifVisible: boolean = false;
  alertSuppVisible: boolean = false;

  public addInterventionVehicule!: FormGroup;
  public editInterventionVehicule!: FormGroup;
  public deleteInterventionVehicule!: FormGroup;

  vehicules: Vehicule[] = []; // Liste des véhicules
  communes: Commune[] = [];
  typeInterventions: TypeIntervention[] = [];

  // NOUVELLES PROPRIÉTÉS POUR GÉRER L'ÉTAT DE SOUMISSION
  isAddingInterventionVehicule: boolean = false;
  isEditingInterventionVehicule: boolean = false;
  isDeletingInterventionVehicule: boolean = false;


  @ViewChild('table') table!: DatatableComponent;

  constructor(private interventionVehiculeService: InterventionsVehiculeService, private formBuilder: FormBuilder) { }

  ngOnInit(): void {
    this.loadVehicules();
    this.loadCommunes();
    this.loadInterventionVehicules();
    this.loadtypeInterventions();

    this.addInterventionVehicule = this.formBuilder.group({
      vehicule_id: [null, [Validators.required]],
      titre: ["", [Validators.required]],
      observation: ["", [Validators.required]],
      date_intervention: ["", [Validators.required]],
      montant: ["", [Validators.required, Validators.min(0)]], // Ajout d'un validateur min(0)
      type_intervention_id: [null, [Validators.required]],
      // commune_depart: [null, [Validators.required]],
      // commune_arriver: [null, [Validators.required]],
    });

    this.editInterventionVehicule = this.formBuilder.group({
      id: [0, [Validators.required]],
      vehicule_id: [null, [Validators.required]], // Changé de 0 à null
      titre: ["", [Validators.required]],
      observation: ["", [Validators.required]],
      date_intervention: ["", [Validators.required]],
      montant: ["", [Validators.required, Validators.min(0)]], // Ajout d'un validateur min(0)
      type_intervention_id: [null, [Validators.required]], // Changé de 0 à null
      // commune_depart: [null, [Validators.required]],
      // commune_arriver: [null, [Validators.required]],
    });

    this.deleteInterventionVehicule = this.formBuilder.group({
      id: [0, [Validators.required]],
    });
  }

  onClickSubmitAddInterventionVehicule() {
    // console.log('onClickSubmitAddInterventionVehicule appelé. isAddingInterventionVehicule:', this.isAddingInterventionVehicule); // Commenté

    // AJOUT DE LA VÉRIFICATION POUR PRÉVENIR LES DOUBLES CLICS
    if (this.isAddingInterventionVehicule) {
      // console.warn('Soumission multiple détectée pour Intervention Véhicule. Annulation.'); // Commenté
      return; // Empêche l'exécution si déjà en cours
    }

    const spinner = document.querySelector('.spinner-add-interv-vehicule'); // Assurez-vous que ce sélecteur correspond à votre HTML

    if (this.addInterventionVehicule.valid) {
      this.isAddingInterventionVehicule = true; // Désactiver le bouton
      // console.log('isAddingInterventionVehicule mis à true.'); // Commenté

      if (spinner) {
        spinner.classList.remove('d-none');
        // console.log('Spinner Intervention Véhicule affiché.'); // Commenté
      }

      const formData = {
        ...this.addInterventionVehicule.value,
        date_intervention: this.formatDate(this.addInterventionVehicule.value.date_intervention), // Convertir la date
      };
      this.interventionVehiculeService.saveInterventionVehicule(formData).subscribe(
        (data: any) => {
          this.loadInterventionVehicules();
          if (spinner) spinner.classList.add('d-none');
          this.addInterventionVehicule.reset();
          this.isAddingInterventionVehicule = false; // Réactiver le bouton
          // console.log('Soumission Intervention Véhicule réussie. isAddingInterventionVehicule mis à false.'); // Commenté

          const modal = document.getElementById('add_intervention_vehicule');
          // @ts-ignore
          const bsModal = bootstrap.Modal.getInstance(modal);
          bsModal?.hide();

          setTimeout(() => {
            this.alertAjoutVisible = true;
            // console.log('Alert visible après fermeture du modal:', this.alertAjoutVisible); // Commenté
            setTimeout(() => {
              this.alertAjoutVisible = false;
            }, 2000);
          }, 200);
        },
        (error: any) => {
          console.error('Erreur lors de l\'ajout de l\'intervention du véhicule :', error);
          if (spinner) spinner.classList.add('d-none');
          this.isAddingInterventionVehicule = false; // Réactiver le bouton en cas d'erreur
          // console.error('Soumission Intervention Véhicule échouée. isAddingInterventionVehicule mis à false.'); // Commenté
          alert('Une erreur s\'est produite. Veuillez réessayer.');
        }
      );
    } else {
      if (spinner) spinner.classList.add('d-none');
      this.markFormGroupTouched(this.addInterventionVehicule); // Marquer les champs comme touchés
      alert("Désolé, le formulaire n'est pas bien renseigné");
      // console.log('Formulaire Intervention Véhicule invalide.'); // Commenté
    }
  }

  onClickSubmitEditInterventionVehicule() {
    // console.log(this.editInterventionVehicule.value); // Commenté
    // AJOUT DE LA VÉRIFICATION POUR PRÉVENIR LES DOUBLES CLICS
    if (this.isEditingInterventionVehicule) {
      // console.warn('Soumission multiple détectée pour édition Intervention Véhicule. Annulation.'); // Commenté
      return; // Empêche l'exécution si déjà en cours
    }

    const spinner = document.querySelector('.spinnerModif');

    if (this.editInterventionVehicule.valid) {
      this.isEditingInterventionVehicule = true; // Désactiver le bouton
      if (spinner) spinner.classList.remove('d-none');
      // const id = this.editInterventionVehicule.value.id; // Non utilisé, peut être supprimé
      const formData = {
        ...this.editInterventionVehicule.value,
        date_intervention: this.formatDate(this.editInterventionVehicule.value.date_intervention), // Convertir la date
      };
      this.interventionVehiculeService.editInterventionVehicule(formData).subscribe(
        (data: any) => {
          this.loadInterventionVehicules();
          if (spinner) spinner.classList.add('d-none');
          this.editInterventionVehicule.reset();
          this.isEditingInterventionVehicule = false; // Réactiver le bouton

          const modal = document.getElementById('edit_intervention_vehicule');
          // @ts-ignore
          const bsModal = bootstrap.Modal.getInstance(modal);
          bsModal?.hide();

          setTimeout(() => {
            this.alertModifVisible = true;
            // console.log('Alert visible après fermeture du modal:', this.alertModifVisible); // Commenté
            setTimeout(() => {
              this.alertModifVisible = false;
            }, 2000);
          }, 200);
        },
        (error: any) => {
          console.error('Erreur lors de la modification de l\'intervention du véhicule :', error);
          if (spinner) spinner.classList.add('d-none');
          this.isEditingInterventionVehicule = false; // Réactiver le bouton en cas d'erreur
          alert('Une erreur s\'est produite. Veuillez réessayer.');
        }
      );
    } else {
      if (spinner) spinner.classList.add('d-none');
      this.markFormGroupTouched(this.editInterventionVehicule); // Marquer les champs comme touchés
      alert("Désolé, le formulaire n'est pas bien renseigné");
    }
  }

  onClickSubmitDeleteInterventionVehicule() {
    // console.log(this.deleteInterventionVehicule.value); // Commenté
    // AJOUT DE LA VÉRIFICATION POUR PRÉVENIR LES DOUBLES CLICS
    if (this.isDeletingInterventionVehicule) {
      // console.warn('Soumission multiple détectée pour suppression Intervention Véhicule. Annulation.'); // Commenté
      return; // Empêche l'exécution si déjà en cours
    }

    const spinner = document.querySelector('.spinnerDelete');

    if (this.deleteInterventionVehicule.valid) {
      this.isDeletingInterventionVehicule = true; // Désactiver le bouton
      if (spinner) spinner.classList.remove('d-none');
      this.interventionVehiculeService.deleteInterventionVehicule(this.deleteInterventionVehicule.value).subscribe(
        (data: any) => {
          this.loadInterventionVehicules();
          if (spinner) spinner.classList.add('d-none');
          this.deleteInterventionVehicule.reset();
          this.isDeletingInterventionVehicule = false; // Réactiver le bouton

          const modal = document.getElementById('delete_intervention_vehicule');
          // @ts-ignore
          const bsModal = bootstrap.Modal.getInstance(modal);
          bsModal?.hide();

          setTimeout(() => {
            this.alertSuppVisible = true;
            // console.log('Alert visible après fermeture du modal:', this.alertSuppVisible); // Commenté
            setTimeout(() => {
              this.alertSuppVisible = false;
            }, 2000);
          }, 200);
        },
        (error: any) => {
          console.error('Erreur lors de la suppression de l\'intervention du véhicule :', error);
          if (spinner) spinner.classList.add('d-none');
          this.isDeletingInterventionVehicule = false; // Réactiver le bouton en cas d'erreur
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

  loadInterventionVehicules(): void {
    this.interventionVehiculeService.getAllInterventionsVehicule().subscribe(
      (data: InterventionVehicule[]) => {
        this.temp = [...data];
        this.rows = data;
        // console.log('Structure de this.rows :', this.rows); // Commenté
        this.loadingIndicator = false;
      },
      error => {
        console.error('Erreur lors du chargement des Interventions des véhicules', error);
        this.loadingIndicator = false;
      }
    );
  }

  // updateFilter(event: KeyboardEvent): void {
  //   const val = (event.target as HTMLInputElement).value.toLowerCase();

  //   this.rows = this.temp.filter(interventionVehicule =>
  //     interventionVehicule.titre.toLowerCase().includes(val) ||
  //     interventionVehicule.observation.toLowerCase().includes(val) ||
  //     interventionVehicule.date_intervention.toLowerCase().includes(val) ||
  //     // Vérifier si l'objet imbriqué existe avant d'accéder à ses propriétés
  //     (interventionVehicule.vehicule && interventionVehicule.vehicule.immatriculation.toLowerCase().includes(val)) ||
  //     (interventionVehicule.type_intervention && interventionVehicule.type_intervention.libelle_type_intervention.toLowerCase().includes(val))
  //   );

  //   this.table.offset = 0;
  // }

  updateFilter(event: KeyboardEvent): void {
    const val = (event.target as HTMLInputElement).value.toLowerCase();

    this.rows = this.temp.filter(interventionVehicule =>
      interventionVehicule.titre.toLowerCase().includes(val)
    );

    this.table.offset = 0;
  }

  getEditForm(row: any) {
    this.editInterventionVehicule.patchValue({
      id: row.id,
      vehicule_id: row.vehicule_id,
      titre: row.titre,
      observation: row.observation,
      date_intervention: this.convertToNgbDate(row.date_intervention),
      montant: row.montant,
      type_intervention_id: row.type_intervention_id,
      // commune_depart: row.commune_depart,
      // commune_arriver: row.commune_arriver,
    })
  }

  getDeleteForm(row: any) {
    this.deleteInterventionVehicule.patchValue({
      id: row.id,
    })
  }

  loadVehicules(): void {
    this.interventionVehiculeService.getAllVehicules().subscribe({
      next: (data) => {
        this.vehicules = data;
      },
      error: (err) => {
        console.error("Erreur lors du chargement des véhicules :", err);
      }
    });
  }

  loadtypeInterventions(): void {
    this.interventionVehiculeService.getAllTypeInterventions().subscribe({
      next: (data) => {
        this.typeInterventions = data; // Stocker la liste des typeInterventions
      },
      error: (err) => {
        console.error("Erreur lors du chargement des typeInterventions :", err);
      }
    });
  }

  loadCommunes(): void {
    this.interventionVehiculeService.getAllCommunes().subscribe({
      next: (data) => {
        this.communes = data; // Stocker la liste des communes
        // console.log('Communes chargées :', this.communes); // Commenté
      },
      error: (err) => {
        console.error("Erreur lors du chargement des communes :", err);
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
}