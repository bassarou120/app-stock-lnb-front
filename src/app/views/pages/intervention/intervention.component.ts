import { Component, ViewChild, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ColumnMode, DatatableComponent, NgxDatatableModule } from '@siemens/ngx-datatable';
import { InterventionsService } from '../../../core/services/intervention/intervention.service';
import { Immobilisation, TypeIntervention, Intervention } from '../../../core/services/interface/models';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from "@angular/forms";
import { CommonModule } from '@angular/common';
import { NgbAlertModule } from '@ng-bootstrap/ng-bootstrap';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectComponent as MyNgSelectComponent } from '@ng-select/ng-select';
import { FeatherIconDirective } from '../../../core/feather-icon/feather-icon.directive';


declare var bootstrap: any;

@Component({
  selector: 'app-intervention',
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
  templateUrl: 'intervention.component.html'
})
export class InterventionComponent implements OnInit {

  rows: Intervention[] = [];
  temp: Intervention[] = [];
  loadingIndicator = true;
  reorderable = true;
  ColumnMode = ColumnMode;

  alertAjoutVisible: boolean = false;  // Pour gérer la visibilité de l'alerte ajout
  alertModifVisible: boolean = false;  // Pour gérer la visibilité de l'alerte mofid
  alertSuppVisible: boolean = false;  // Pour gérer la visibilité de l'alerte supp

  public addIntervention!: FormGroup;
  public editIntervention!: FormGroup;
  public deleteIntervention!: FormGroup;

  immobilisations: Immobilisation[] = []; // Liste des immos
  typeInterventions: TypeIntervention[] = []; // Liste des types d'intervention



  @ViewChild('table') table!: DatatableComponent;

  constructor(private interventionService: InterventionsService, private formBuilder: FormBuilder,) { }

  ngOnInit(): void {
    this.loadImmobilisations();
    this.loadtypeInterventions();
    this.loadInterventions();

    this.addIntervention = this.formBuilder.group({
      immo_id: [null, [Validators.required]],
      type_intervention_id: [null, [Validators.required]],
      titre: ["", [Validators.required]],
      observation: ["", [Validators.required]],
      date_intervention: ["", [Validators.required]],
      cout: ["", [Validators.required]],
    });
    this.editIntervention = this.formBuilder.group({
      id: [0, [Validators.required]],
      immo_id: [0, [Validators.required]],
      type_intervention_id: [0, [Validators.required]],
      titre: ["", [Validators.required]],
      observation: ["", [Validators.required]],
      date_intervention: ["", [Validators.required]],
      cout: ["", [Validators.required]],
    });
    this.deleteIntervention = this.formBuilder.group({
      id: [0, [Validators.required]],
    });
  }
  onClickSubmitAddIntervention() {
    console.log(this.addIntervention.value);
    const spinner = document.querySelector('.spinner-border');

    if (this.addIntervention.valid) {
      if (spinner) spinner.classList.remove('d-none');
      this.interventionService.saveIntervention(this.addIntervention.value).subscribe(
        (data: any) => {
          this.loadInterventions();
          if (spinner) spinner.classList.add('d-none');
          this.addIntervention.reset();

          // Fermer le modal manuellement
          const modal = document.getElementById('add_intervention');
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
          console.error('Erreur lors de l\'ajout de l\'intervention :', error);
          if (spinner) spinner.classList.add('d-none');
          alert('Une erreur s\'est produite. Veuillez réessayer.');
        }
      );
    } else {
      if (spinner) spinner.classList.add('d-none');
      alert("Désolé, le formulaire n'est pas bien renseigné");
    }
  }

  onClickSubmitEditIntervention() {
    console.log(this.editIntervention.value);
    const spinner = document.querySelector('.spinnerModif');

    if (this.editIntervention.valid) {
      if (spinner) spinner.classList.remove('d-none');
      const id = this.editIntervention.value.id;
      this.interventionService.editIntervention(this.editIntervention.value).subscribe(
        (data: any) => {
          this.loadInterventions();
          if (spinner) spinner.classList.add('d-none');
          this.editIntervention.reset();

          // Fermer le modal manuellement
          const modal = document.getElementById('edit_intervention');
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
          console.error('Erreur lors de la modification de l\'intervention :', error);
          if (spinner) spinner.classList.add('d-none');
          alert('Une erreur s\'est produite. Veuillez réessayer.');
        }
      );
    } else {
      if (spinner) spinner.classList.add('d-none');
      alert("Désolé, le formulaire n'est pas bien renseigné");
    }
  }

  onClickSubmitDeleteIntervention() {
    console.log(this.deleteIntervention.value);
    const spinner = document.querySelector('.spinnerDelete');

    if (this.deleteIntervention.valid) {
      if (spinner) spinner.classList.remove('d-none');
      this.interventionService.deleteIntervention(this.deleteIntervention.value).subscribe(
        (data: any) => {
          this.loadInterventions();
          if (spinner) spinner.classList.add('d-none');
          this.deleteIntervention.reset();

          // Fermer le modal manuellement
          const modal = document.getElementById('delete_intervention');
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
          console.error('Erreur lors de la supression de l\'intervention :', error);
          if (spinner) spinner.classList.add('d-none');
          alert('Une erreur s\'est produite. Veuillez réessayer.');
        }
      );
    } else {
      if (spinner) spinner.classList.add('d-none');
      alert("Désolé, le formulaire n'est pas bien renseigné");
    }
  }

  loadInterventions(): void {
      this.interventionService.getAllInterventions().subscribe(
        (data: Intervention[]) => {
          this.temp = [...data]; // Sauvegarde de la liste complète pour la recherche
          this.rows = data;
          this.loadingIndicator = false;
        },
        error => {
          console.error('Erreur lors du chargement des Interventions', error);
          this.loadingIndicator = false;
        }
      );
    }




  updateFilter(event: KeyboardEvent): void {
    const val = (event.target as HTMLInputElement).value.toLowerCase();

    this.rows = this.temp.filter(intervention =>
      intervention.titre.toLowerCase().includes(val)
    );

    this.table.offset = 0;
  }

  getEditForm(row: any) {
    this.editIntervention.patchValue({
      id: row.id,
      immo_id: row.immo_id,
      type_intervention_id: row.type_intervention_id,
      titre: row.titre,
      observation: row.observation,
      date_intervention: row.date_intervention,
      cout: row.cout,
    })
  }

  getDeleteForm(row: any) {
    this.deleteIntervention.patchValue({
      id: row.id,
    })
  }

  loadImmobilisations(): void {
    this.interventionService.getAllImmobilisations().subscribe({
      next: (data) => {
        this.immobilisations = data; // Stocker la liste des immos
      },
      error: (err) => {
        console.error("Erreur lors du chargement des immobilisations :", err);
      }
    });
  }
  loadtypeInterventions(): void {
    this.interventionService.getAllTypeInterventions().subscribe({
      next: (data) => {
        this.typeInterventions = data; // Stocker la liste des typeInterventions
      },
      error: (err) => {
        console.error("Erreur lors du chargement des typeInterventions :", err);
      }
    });
  }

}


