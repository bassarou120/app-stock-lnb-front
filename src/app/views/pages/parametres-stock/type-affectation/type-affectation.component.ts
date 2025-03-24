import { Component, ViewChild, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ColumnMode, DatatableComponent, NgxDatatableModule } from '@siemens/ngx-datatable';
import { TypeAffectationService } from '../../../../core/services/type-affectation/type-affectation.service';
import { TypeAffectation } from '../../../../core/services/interface/models';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule  } from "@angular/forms";
import { CommonModule } from '@angular/common';
import { NgbAlertModule } from '@ng-bootstrap/ng-bootstrap';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
declare var bootstrap: any;

@Component({
  selector: 'app-type-affectation',
  standalone: true,
  imports: [
    RouterLink,
    NgxDatatableModule,
    ReactiveFormsModule,
    CommonModule,
    NgbAlertModule,
    NgbDropdownModule
  ],
  templateUrl: 'type-affectation.component.html'
})
export class TypeAffectationComponent implements OnInit {

  rows: TypeAffectation[] = [];
  temp: TypeAffectation[] = [];
  loadingIndicator = true;
  reorderable = true;
  ColumnMode = ColumnMode;

  alertAjoutVisible: boolean = false;  // Pour gérer la visibilité de l'alerte ajout
  alertModifVisible: boolean = false;  // Pour gérer la visibilité de l'alerte mofid
  alertSuppVisible: boolean = false;  // Pour gérer la visibilité de l'alerte supp

  public addTypeAffectation!: FormGroup ;
  public editTypeAffectation!: FormGroup ;
  public deleteTypeAffectation!: FormGroup ;

  @ViewChild('table') table!: DatatableComponent;

  constructor(private typeAffectationService: TypeAffectationService, private formBuilder: FormBuilder,) {}

  ngOnInit(): void {
    this.loadTypeAffectations();
    this.addTypeAffectation = this.formBuilder.group({
      libelle_type_affectation: ["", [Validators.required]],
      valeur: ["" ,[]],
   });
    this.editTypeAffectation = this.formBuilder.group({
      id: [0, [Validators.required]],
      libelle_type_affectation: ["", [Validators.required]],
      valeur: [0 ,[]],
   });
    this.deleteTypeAffectation = this.formBuilder.group({
      id: [0, [Validators.required]],
   });
  }
  onClickSubmitAddTypeAffectation() {
  console.log(this.addTypeAffectation.value);
  const spinner = document.querySelector('.spinner-border');

  if (this.addTypeAffectation.valid) {
    if (spinner) spinner.classList.remove('d-none');
    this.typeAffectationService.saveTypeAffectation(this.addTypeAffectation.value).subscribe(
      (data: any) => {
        this.loadTypeAffectations();
        if (spinner) spinner.classList.add('d-none');
        this.addTypeAffectation.reset();

        // Fermer le modal manuellement
        const modal = document.getElementById('add_typeAffectation');
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
        console.error('Erreur lors de l\'ajout du Type Affectation :', error);
        if (spinner) spinner.classList.add('d-none');
        alert('Une erreur s\'est produite. Veuillez réessayer.');
      }
    );
  } else {
    if (spinner) spinner.classList.add('d-none');
    alert("Désolé, le formulaire n'est pas bien renseigné");
  }
}

onClickSubmitEditTypeAffectation(){
  console.log(this.editTypeAffectation.value);
  const spinner = document.querySelector('.spinnerModif');

  if (this.editTypeAffectation.valid) {
    if (spinner) spinner.classList.remove('d-none');
    const id = this.editTypeAffectation.value.id;
    this.typeAffectationService.editTypeAffectation(this.editTypeAffectation.value).subscribe(
      (data: any) => {
        this.loadTypeAffectations();
        if (spinner) spinner.classList.add('d-none');
        this.editTypeAffectation.reset();

        // Fermer le modal manuellement
        const modal = document.getElementById('edit_typeAffectation');
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
        console.error('Erreur lors de la modification du Type Affectation :', error);
        if (spinner) spinner.classList.add('d-none');
        alert('Une erreur s\'est produite. Veuillez réessayer.');
      }
    );
  } else {
    if (spinner) spinner.classList.add('d-none');
    alert("Désolé, le formulaire n'est pas bien renseigné");
  }
}

onClickSubmitDeleteTypeAffectation(){
  console.log(this.deleteTypeAffectation.value);
  const spinner = document.querySelector('.spinnerDelete');

  if (this.deleteTypeAffectation.valid) {
    if (spinner) spinner.classList.remove('d-none');
    this.typeAffectationService.deleteTypeAffectation(this.deleteTypeAffectation.value).subscribe(
      (data: any) => {
        this.loadTypeAffectations();
        if (spinner) spinner.classList.add('d-none');
        this.deleteTypeAffectation.reset();

        // Fermer le modal manuellement
        const modal = document.getElementById('delete_typeAffectation');
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
        console.error('Erreur lors de la supression du Type Affectation :', error);
        if (spinner) spinner.classList.add('d-none');
        alert('Une erreur s\'est produite. Veuillez réessayer.');
      }
    );
  } else {
    if (spinner) spinner.classList.add('d-none');
    alert("Désolé, le formulaire n'est pas bien renseigné");
  }
}



loadTypeAffectations(): void {
    this.typeAffectationService.getAllTypeAffectations().subscribe(
      (data: TypeAffectation[]) => {
        this.temp = [...data]; // Sauvegarde de la liste complète pour la recherche
        this.rows = data;
        this.loadingIndicator = false;
      },
      error => {
        console.error('Erreur lors du chargement des Types Affectation', error);
        this.loadingIndicator = false;
      }
    );
  }

  updateFilter(event: KeyboardEvent): void {
    const val = (event.target as HTMLInputElement).value.toLowerCase();

    this.rows = this.temp.filter(typeAffectation =>
      typeAffectation.libelle_type_affectation.toLowerCase().includes(val)
    );

    this.table.offset = 0;
  }

  getEditForm(row: any){
    this.editTypeAffectation.patchValue({
     id:row.id,
     libelle_type_affectation:row.libelle_type_affectation,
     valeur:row.valeur,
    })
  }

  getDeleteForm(row: any){
    this.deleteTypeAffectation.patchValue({
     id:row.id,
    })
  }
}


