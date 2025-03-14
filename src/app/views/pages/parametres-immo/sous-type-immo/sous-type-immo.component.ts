import { Component, ViewChild, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ColumnMode, DatatableComponent, NgxDatatableModule } from '@siemens/ngx-datatable';
import { SousTypeImmoService } from '../../../../core/services/sous-type-immo/sous-type-immo.service';
import { SousTypeImmo, TypeImmo } from '../../../../core/services/interface/models';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule  } from "@angular/forms";
import { CommonModule } from '@angular/common';
import { NgbAlertModule } from '@ng-bootstrap/ng-bootstrap';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { NgSelectComponent as MyNgSelectComponent } from '@ng-select/ng-select';
declare var bootstrap: any;

@Component({
  selector: 'app-sous-type-immo',
  standalone: true,
  imports: [
    RouterLink,
    NgxDatatableModule,
    ReactiveFormsModule,
    CommonModule,
    NgbAlertModule,
    NgbDropdownModule,
    FormsModule,
    MyNgSelectComponent,
    
  ],
  templateUrl: 'sous-type-immo.component.html'
})
export class SousTypeImmoComponent implements OnInit {

  rows: SousTypeImmo[] = [];
  temp: SousTypeImmo[] = [];
  loadingIndicator = true;
  reorderable = true;
  ColumnMode = ColumnMode;

  typeImmos: TypeImmo[] = []; // Liste des types d'immos
  selectedTypeImmoId: number | null = null; // ID sélectionné

  alertAjoutVisible: boolean = false;  // Pour gérer la visibilité de l'alerte ajout
  alertModifVisible: boolean = false;  // Pour gérer la visibilité de l'alerte mofid
  alertSuppVisible: boolean = false;  // Pour gérer la visibilité de l'alerte supp

  public addSousTypeImmo!: FormGroup ;
  public editSousTypeImmo!: FormGroup ;
  public deleteSousTypeImmo!: FormGroup ;

  @ViewChild('table') table!: DatatableComponent;

  constructor(private sousTypeImmoService: SousTypeImmoService,private formBuilder: FormBuilder,) {}

  ngOnInit(): void {
    this.loadTypeImmos();
    this.loadSousTypeImmos();
    this.addSousTypeImmo = this.formBuilder.group({
      libelle: ["", [Validators.required]],
      id_type_immo: [null, [Validators.required]],
      compte: ["" ,[Validators.required]],
   });
    this.editSousTypeImmo = this.formBuilder.group({
      id: [0, [Validators.required]],
      id_type_immo: [0, [Validators.required]],
      libelle: ["", [Validators.required]],
      compte: ["" ,[Validators.required]],
   });
    this.deleteSousTypeImmo = this.formBuilder.group({
      id: [0, [Validators.required]],
   });
  }

  onClickSubmitAddSousTypeImmo() {
  console.log(this.addSousTypeImmo.value);
  const spinner = document.querySelector('.spinner-border');

  if (this.addSousTypeImmo.valid) {
    if (spinner) spinner.classList.remove('d-none');
    this.sousTypeImmoService.saveSousTypeImmo(this.addSousTypeImmo.value).subscribe(
      (data: any) => {
        this.loadSousTypeImmos();
        if (spinner) spinner.classList.add('d-none');
        this.addSousTypeImmo.reset();

        // Fermer le modal manuellement
        const modal = document.getElementById('add_sousTypeImmo');
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
        console.error('Erreur lors de l\'ajout du sous type d\'immobilisation :', error);
        if (spinner) spinner.classList.add('d-none');
        alert('Une erreur s\'est produite. Veuillez réessayer.');
      }
    );
  } else {
    if (spinner) spinner.classList.add('d-none');
    alert("Désolé, le formulaire n'est pas bien renseigné");
  }
}

onClickSubmitEditSousTypeImmo(){
  console.log(this.editSousTypeImmo.value);
  const spinner = document.querySelector('.spinnerModif');

  if (this.editSousTypeImmo.valid) {
    if (spinner) spinner.classList.remove('d-none');
    const id = this.editSousTypeImmo.value.id;
    this.sousTypeImmoService.editSousTypeImmo(this.editSousTypeImmo.value).subscribe(
      (data: any) => {
        this.loadSousTypeImmos();
        if (spinner) spinner.classList.add('d-none');
        this.editSousTypeImmo.reset();

        // Fermer le modal manuellement
        const modal = document.getElementById('edit_sousTypeImmo');
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
        console.error('Erreur lors de la modification du sous type d\'Immobilisation :', error);
        if (spinner) spinner.classList.add('d-none');
        alert('Une erreur s\'est produite. Veuillez réessayer.');
      }
    );
  } else {
    if (spinner) spinner.classList.add('d-none');
    alert("Désolé, le formulaire n'est pas bien renseigné");
  }
}

onClickSubmitDeleteSousTypeImmo(){
  console.log(this.deleteSousTypeImmo.value);
  const spinner = document.querySelector('.spinnerDelete');

  if (this.deleteSousTypeImmo.valid) {
    if (spinner) spinner.classList.remove('d-none');
    this.sousTypeImmoService.deleteSousTypeImmo(this.deleteSousTypeImmo.value).subscribe(
      (data: any) => {
        this.loadSousTypeImmos();
        if (spinner) spinner.classList.add('d-none');
        this.deleteSousTypeImmo.reset();

        // Fermer le modal manuellement
        const modal = document.getElementById('delete_sousTypeImmo');
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
        console.error('Erreur lors de la supression du sous Type d\'Immo :', error);
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
  this.sousTypeImmoService.getAllTypeImmos().subscribe({
    next: (data) => {
      this.typeImmos = data; // Stocker la liste des types d'immos
    },
    error: (err) => {
      console.error("Erreur lors du chargement des types d'immos :", err);
    }
  });
}


loadSousTypeImmos(): void {
    this.sousTypeImmoService.getAllSousTypeImmos().subscribe(
      (data: SousTypeImmo[]) => {
        this.temp = [...data]; // Sauvegarde de la liste complète pour la recherche
        this.rows = data;
        this.loadingIndicator = false;
      },
      error => {
        console.error('Erreur lors du chargement des Sous Type d\'Immobilisations', error);
        this.loadingIndicator = false;
      }
    );
  }

  updateFilter(event: KeyboardEvent): void {
    const val = (event.target as HTMLInputElement).value.toLowerCase();

    this.rows = this.temp.filter(sousTypeImmo =>
      sousTypeImmo.libelle.toLowerCase().includes(val)
    );

    this.table.offset = 0;
  }

  getEditForm(row: any){
    this.editSousTypeImmo.patchValue({
     id:row.id,
     id_type_immo:row.id_type_immo,
     libelle:row.libelle,
     compte:row.compte,
    })
  }

  getDeleteForm(row: any){
    this.deleteSousTypeImmo.patchValue({
     id:row.id,
    })
  }
 }


