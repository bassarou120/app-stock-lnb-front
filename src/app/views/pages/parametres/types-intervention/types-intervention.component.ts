import { Component, ViewChild, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ColumnMode, DatatableComponent, NgxDatatableModule } from '@siemens/ngx-datatable';
import { TypeInterventionService } from '../../../../core/services/types-intervention/types-intervention.service';
import { TypeIntervention } from '../../../../core/services/interface/models';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule  } from "@angular/forms";
import { CommonModule } from '@angular/common';
import { NgbAlertModule } from '@ng-bootstrap/ng-bootstrap';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
declare var bootstrap: any;

@Component({
  selector: 'app-types-intervention',
  standalone: true,
  imports: [
    RouterLink,
    NgxDatatableModule,
    ReactiveFormsModule,
    CommonModule,
    NgbAlertModule,
    NgbDropdownModule,
    NgbTooltipModule 
  ],
  templateUrl: 'types-intervention.component.html'
})
export class TypesInterventionComponent implements OnInit {

  rows: TypeIntervention[] = [];
  temp: TypeIntervention[] = [];
  loadingIndicator = true;
  reorderable = true;
  ColumnMode = ColumnMode;

  alertAjoutVisible: boolean = false;  // Pour gérer la visibilité de l'alerte ajout
  alertModifVisible: boolean = false;  // Pour gérer la visibilité de l'alerte mofid
  alertSuppVisible: boolean = false;  // Pour gérer la visibilité de l'alerte supp

  public addTypeIntervention!: FormGroup ;
  public editTypeIntervention!: FormGroup ;
  public deleteTypeIntervention!: FormGroup ;

  @ViewChild('table') table!: DatatableComponent;

  constructor(private typeInterventionService: TypeInterventionService, private formBuilder: FormBuilder,) {}

  ngOnInit(): void {
    this.loadTypeInterventions();
    this.addTypeIntervention = this.formBuilder.group({
      libelle_type_intervention: ["", [Validators.required]],
      applicable_seul_vehicule: [1, [Validators.required]],
      observation: ["", []],
   });
    this.editTypeIntervention = this.formBuilder.group({
      id: [0, [Validators.required]],
      libelle_type_intervention: ["", [Validators.required]],
      applicable_seul_vehicule: [1, [Validators.required]],
      observation: ["", []],
   });
    this.deleteTypeIntervention = this.formBuilder.group({
      id: [0, [Validators.required]],
   });
  }
  onClickSubmitAddTypeIntervention() {
  console.log(this.addTypeIntervention.value);
  const spinner = document.querySelector('.spinner-border');

  if (this.addTypeIntervention.valid) {
    if (spinner) spinner.classList.remove('d-none');
    this.typeInterventionService.saveTypeIntervention(this.addTypeIntervention.value).subscribe(
      (data: any) => {
        this.loadTypeInterventions();
        if (spinner) spinner.classList.add('d-none');
        this.addTypeIntervention.reset();
        this.addTypeIntervention.patchValue({ applicable_seul_vehicule: 1 });

        // Fermer le modal manuellement
        const modal = document.getElementById('add_typeIntervention');
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
        console.error('Erreur lors de l\'ajout de la commune :', error);
        if (spinner) spinner.classList.add('d-none');
        alert('Une erreur s\'est produite. Veuillez réessayer.');
      }
    );
  } else {
    if (spinner) spinner.classList.add('d-none');
    alert("Désolé, le formulaire n'est pas bien renseigné");
  }
}

onClickSubmitEditTypeIntervention(){
  console.log(this.editTypeIntervention.value);
  const spinner = document.querySelector('.spinnerModif');

  if (this.editTypeIntervention.valid) {
    if (spinner) spinner.classList.remove('d-none');
    const id = this.editTypeIntervention.value.id;
    this.typeInterventionService.editTypeIntervention(this.editTypeIntervention.value).subscribe(
      (data: any) => {
        this.loadTypeInterventions();
        if (spinner) spinner.classList.add('d-none');
        this.editTypeIntervention.reset();

        // Fermer le modal manuellement
        const modal = document.getElementById('edit_typeIntervention');
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
        console.error('Erreur lors de la modification du Type Intervention :', error);
        if (spinner) spinner.classList.add('d-none');
        alert('Une erreur s\'est produite. Veuillez réessayer.');
      }
    );
  } else {
    if (spinner) spinner.classList.add('d-none');
    alert("Désolé, le formulaire n'est pas bien renseigné");
  }
}

onClickSubmitDeleteTypeIntervention(){
  console.log(this.deleteTypeIntervention.value);
  const spinner = document.querySelector('.spinnerDelete');

  if (this.deleteTypeIntervention.valid) {
    if (spinner) spinner.classList.remove('d-none');
    this.typeInterventionService.deleteTypeIntervention(this.deleteTypeIntervention.value).subscribe(
      (data: any) => {
        this.loadTypeInterventions();
        if (spinner) spinner.classList.add('d-none');
        this.deleteTypeIntervention.reset();

        // Fermer le modal manuellement
        const modal = document.getElementById('delete_typeIntervention');
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
        console.error('Erreur lors de la supression du Type Intervention :', error);
        if (spinner) spinner.classList.add('d-none');
        alert('Une erreur s\'est produite. Veuillez réessayer.');
      }
    );
  } else {
    if (spinner) spinner.classList.add('d-none');
    alert("Désolé, le formulaire n'est pas bien renseigné");
  }
}

  

  loadTypeInterventions(): void {
    this.typeInterventionService.getAllTypeInterventions().subscribe(
      (data: TypeIntervention[]) => {
        this.temp = [...data]; // Sauvegarde de la liste complète pour la recherche
        this.rows = data;
        this.loadingIndicator = false;
      },
      error => {
        console.error('Erreur lors du chargement des Type Interventions', error);
        this.loadingIndicator = false;
      }
    );
  }

  updateFilter(event: KeyboardEvent): void {
    const val = (event.target as HTMLInputElement).value.toLowerCase();

    this.rows = this.temp.filter(typeIntervention =>
      typeIntervention.libelle_type_intervention.toLowerCase().includes(val)
    );

    this.table.offset = 0;
  }

  getEditForm(row: any){
    this.editTypeIntervention.patchValue({
     id:row.id,
     libelle_type_intervention:row.libelle_type_intervention,
     applicable_seul_vehicule:row.applicable_seul_vehicule ? 1 : 0,
     observation:row.observation,
    })
  }

  getDeleteForm(row: any){
    this.deleteTypeIntervention.patchValue({
     id:row.id,
    })
  }

  onCheckboxChange(event: any) {
    this.addTypeIntervention.patchValue({
      applicable_seul_vehicule: event.target.checked ? 1 : 0
    });
  }

  onCheckboxEditChange(event: any) {
    this.editTypeIntervention.patchValue({
      applicable_seul_vehicule: event.target.checked ? 1 : 0
    });
  }
}


