import { Component, ViewChild, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ColumnMode, DatatableComponent, NgxDatatableModule } from '@siemens/ngx-datatable';
import { TypeImmoService } from '../../../../core/services/type-immo/type-immo.service';
import { TypeImmo } from '../../../../core/services/interface/models';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule  } from "@angular/forms";
import { CommonModule } from '@angular/common';
import { NgbAlertModule } from '@ng-bootstrap/ng-bootstrap';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
declare var bootstrap: any;

@Component({
  selector: 'app-type-immo',
  standalone: true,
  imports: [
    RouterLink,
    NgxDatatableModule,
    ReactiveFormsModule,
    CommonModule,
    NgbAlertModule,
    NgbDropdownModule
  ],
  templateUrl: 'type-immo.component.html'
})
export class TypeImmoComponent implements OnInit {

  rows: TypeImmo[] = [];
  temp: TypeImmo[] = [];
  loadingIndicator = true;
  reorderable = true;
  ColumnMode = ColumnMode;

  alertAjoutVisible: boolean = false;  // Pour gérer la visibilité de l'alerte ajout
  alertModifVisible: boolean = false;  // Pour gérer la visibilité de l'alerte mofid
  alertSuppVisible: boolean = false;  // Pour gérer la visibilité de l'alerte supp

  public addTypeImmo!: FormGroup ;
  public editTypeImmo!: FormGroup ;
  public deleteTypeImmo!: FormGroup ;

  @ViewChild('table') table!: DatatableComponent;

  constructor(private typeImmoService: TypeImmoService, private formBuilder: FormBuilder,) {}

  ngOnInit(): void {
    this.loadTypeImmos();
    this.addTypeImmo = this.formBuilder.group({
      libelle_typeImmo: ["", [Validators.required]],
      compte: ["" ,[Validators.required]],
   });
    this.editTypeImmo = this.formBuilder.group({
      id: [0, [Validators.required]],
      libelle_typeImmo: ["", [Validators.required]],
      compte: ["" ,[Validators.required]],
   });
    this.deleteTypeImmo = this.formBuilder.group({
      id: [0, [Validators.required]],
   });
  }

  onClickSubmitAddTypeImmo() {
  console.log(this.addTypeImmo.value);
  const spinner = document.querySelector('.spinner-border');

  if (this.addTypeImmo.valid) {
    if (spinner) spinner.classList.remove('d-none');
    this.typeImmoService.saveTypeImmo(this.addTypeImmo.value).subscribe(
      (data: any) => {
        this.loadTypeImmos();
        if (spinner) spinner.classList.add('d-none');
        this.addTypeImmo.reset();

        // Fermer le modal manuellement
        const modal = document.getElementById('add_typeImmo');
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
        console.error('Erreur lors de l\'ajout du type d\'immobilisation :', error);
        if (spinner) spinner.classList.add('d-none');
        alert('Une erreur s\'est produite. Veuillez réessayer.');
      }
    );
  } else {
    if (spinner) spinner.classList.add('d-none');
    alert("Désolé, le formulaire n'est pas bien renseigné");
  }
}

onClickSubmitEditTypeImmo(){
  console.log(this.editTypeImmo.value);
  const spinner = document.querySelector('.spinnerModif');

  if (this.editTypeImmo.valid) {
    if (spinner) spinner.classList.remove('d-none');
    const id = this.editTypeImmo.value.id;
    this.typeImmoService.editTypeImmo(this.editTypeImmo.value).subscribe(
      (data: any) => {
        this.loadTypeImmos();
        if (spinner) spinner.classList.add('d-none');
        this.editTypeImmo.reset();

        // Fermer le modal manuellement
        const modal = document.getElementById('edit_typeImmo');
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
        console.error('Erreur lors de la modification du type d\'Immobilisation :', error);
        if (spinner) spinner.classList.add('d-none');
        alert('Une erreur s\'est produite. Veuillez réessayer.');
      }
    );
  } else {
    if (spinner) spinner.classList.add('d-none');
    alert("Désolé, le formulaire n'est pas bien renseigné");
  }
}

onClickSubmitDeleteTypeImmo(){
  console.log(this.deleteTypeImmo.value);
  const spinner = document.querySelector('.spinnerDelete');

  if (this.deleteTypeImmo.valid) {
    if (spinner) spinner.classList.remove('d-none');
    this.typeImmoService.deleteTypeImmo(this.deleteTypeImmo.value).subscribe(
      (data: any) => {
        this.loadTypeImmos();
        if (spinner) spinner.classList.add('d-none');
        this.deleteTypeImmo.reset();

        // Fermer le modal manuellement
        const modal = document.getElementById('delete_typeImmo');
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
        console.error('Erreur lors de la supression du Type d\'Immo :', error);
        if (spinner) spinner.classList.add('d-none');
        alert('Une erreur s\'est produite. Veuillez réessayer.');
      }
    );
  } else {
    if (spinner) spinner.classList.add('d-none');
    alert("Désolé, le formulaire n'est pas bien renseigné");
  }
}



loadTypeImmos(): void {
    this.typeImmoService.getAllTypeImmos().subscribe(
      (data: TypeImmo[]) => {
        this.temp = [...data]; // Sauvegarde de la liste complète pour la recherche
        this.rows = data;
        this.loadingIndicator = false;
      },
      error => {
        console.error('Erreur lors du chargement des Typeq d\'Immobilisations', error);
        this.loadingIndicator = false;
      }
    );
  }

  updateFilter(event: KeyboardEvent): void {
    const val = (event.target as HTMLInputElement).value.toLowerCase();

    this.rows = this.temp.filter(typeImmo =>
      typeImmo.libelle_typeImmo.toLowerCase().includes(val)
    );

    this.table.offset = 0;
  }

  getEditForm(row: any){
    this.editTypeImmo.patchValue({
     id:row.id,
     libelle_typeImmo:row.libelle_typeImmo,
     compte:row.compte,
    })
  }

  getDeleteForm(row: any){
    this.deleteTypeImmo.patchValue({
     id:row.id,
    })
  }
 }


