import { Component, ViewChild, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ColumnMode, DatatableComponent, NgxDatatableModule } from '@siemens/ngx-datatable';
import { InterventionsVehiculeService } from '../../../core/services/interventionvehicules/interventionvehicules.service'; // Assurez-vous que le chemin est correct
import { InterventionVehicule, TypeIntervention, Vehicule } from '../../../core/services/interface/models'; // Assurez-vous que le chemin est correct
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from "@angular/forms";
import { CommonModule } from '@angular/common';
import { NgbAlertModule } from '@ng-bootstrap/ng-bootstrap';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectComponent as MyNgSelectComponent } from '@ng-select/ng-select';
import { FeatherIconDirective } from '../../../core/feather-icon/feather-icon.directive';
import { Commune } from '../../../core/services/interface/models';


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
    FeatherIconDirective
  ],
  templateUrl: 'interventionvehicules.component.html'
})

export class InterventionVehiculeComponent implements OnInit {

  rows: any[] = []; // Utilisez 'any[]' car la structure de 'Intervention' n'est pas directement réutilisable
  temp: any[] = [];
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
      montant: ["", [Validators.required]],
      type_intervention_id: [null, [Validators.required]],
      // commune_depart: [null, [Validators.required]],
      // commune_arriver: [null, [Validators.required]],
    });

    this.editInterventionVehicule = this.formBuilder.group({
      id: [0, [Validators.required]],
      vehicule_id: [0, [Validators.required]],
      titre: ["", [Validators.required]],
      observation: ["", [Validators.required]],
      date_intervention: ["", [Validators.required]],
      montant: ["", [Validators.required]],
      type_intervention_id: [null, [Validators.required]],
      // commune_depart: [null, [Validators.required]],
      // commune_arriver: [null, [Validators.required]],
    });

    this.deleteInterventionVehicule = this.formBuilder.group({
      id: [0, [Validators.required]],
    });
  }

  onClickSubmitAddInterventionVehicule() {
    console.log(this.addInterventionVehicule.value);
    const spinner = document.querySelector('.spinner-border');

    if (this.addInterventionVehicule.valid) {
      if (spinner) spinner.classList.remove('d-none');
      this.interventionVehiculeService.saveInterventionVehicule(this.addInterventionVehicule.value).subscribe(
        (data: any) => {
          this.loadInterventionVehicules();
          if (spinner) spinner.classList.add('d-none');
          this.addInterventionVehicule.reset();

          const modal = document.getElementById('add_intervention_vehicule');
          // @ts-ignore
          const bsModal = bootstrap.Modal.getInstance(modal);
          bsModal?.hide();

          setTimeout(() => {
            this.alertAjoutVisible = true;
            setTimeout(() => {
              this.alertAjoutVisible = false;
            }, 2000);
          }, 200);
        },
        (error: any) => {
          console.error('Erreur lors de l\'ajout de l\'intervention du véhicule :', error);
          if (spinner) spinner.classList.add('d-none');
          alert('Une erreur s\'est produite. Veuillez réessayer.');
        }
      );
    } else {
      if (spinner) spinner.classList.add('d-none');
      alert("Désolé, le formulaire n'est pas bien renseigné");
    }
  }

  onClickSubmitEditInterventionVehicule() {
    console.log(this.editInterventionVehicule.value);
    const spinner = document.querySelector('.spinnerModif');

    if (this.editInterventionVehicule.valid) {
      if (spinner) spinner.classList.remove('d-none');
      const id = this.editInterventionVehicule.value.id;
      this.interventionVehiculeService.editInterventionVehicule(this.editInterventionVehicule.value).subscribe(
        (data: any) => {
          this.loadInterventionVehicules();
          if (spinner) spinner.classList.add('d-none');
          this.editInterventionVehicule.reset();

          const modal = document.getElementById('edit_intervention_vehicule');
          // @ts-ignore
          const bsModal = bootstrap.Modal.getInstance(modal);
          bsModal?.hide();

          setTimeout(() => {
            this.alertModifVisible = true;
            setTimeout(() => {
              this.alertModifVisible = false;
            }, 2000);
          }, 200);
        },
        (error: any) => {
          console.error('Erreur lors de la modification de l\'intervention du véhicule :', error);
          if (spinner) spinner.classList.add('d-none');
          alert('Une erreur s\'est produite. Veuillez réessayer.');
        }
      );
    } else {
      if (spinner) spinner.classList.add('d-none');
      alert("Désolé, le formulaire n'est pas bien renseigné");
    }
  }

  onClickSubmitDeleteInterventionVehicule() {
    console.log(this.deleteInterventionVehicule.value);
    const spinner = document.querySelector('.spinnerDelete');

    if (this.deleteInterventionVehicule.valid) {
      if (spinner) spinner.classList.remove('d-none');
      this.interventionVehiculeService.deleteInterventionVehicule(this.deleteInterventionVehicule.value).subscribe(
        (data: any) => {
          this.loadInterventionVehicules();
          if (spinner) spinner.classList.add('d-none');
          this.deleteInterventionVehicule.reset();

          const modal = document.getElementById('delete_intervention_vehicule');
          // @ts-ignore
          const bsModal = bootstrap.Modal.getInstance(modal);
          bsModal?.hide();

          setTimeout(() => {
            this.alertSuppVisible = true;
            setTimeout(() => {
              this.alertSuppVisible = false;
            }, 2000);
          }, 200);
        },
        (error: any) => {
          console.error('Erreur lors de la suppression de l\'intervention du véhicule :', error);
          if (spinner) spinner.classList.add('d-none');
          alert('Une erreur s\'est produite. Veuillez réessayer.');
        }
      );
    } else {
      if (spinner) spinner.classList.add('d-none');
      alert("Désolé, le formulaire n'est pas bien renseigné");
    }
  }

  loadInterventionVehicules(): void {
    this.interventionVehiculeService.getAllInterventionsVehicule().subscribe(
      (data: InterventionVehicule[]) => { 
        this.temp = [...data];
        this.rows = data;
        console.log('Structure de this.rows :', this.rows);
        this.loadingIndicator = false;
      },
      error => {
        console.error('Erreur lors du chargement des Interventions des véhicules', error);
        this.loadingIndicator = false;
      }
    );
  }



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
      date_intervention: row.date_intervention,
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
    this.interventionVehiculeService.getAllCommunes().subscribe({ // Assurez-vous que cette méthode existe dans TrajetsService
      next: (data) => {
        this.communes = data; // Stocker la liste des communes
        console.log('Communes chargées :', this.communes);
      },
      error: (err) => {
        console.error("Erreur lors du chargement des communes :", err);
      }
    });
  }
}
