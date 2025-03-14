import { Component, ViewChild, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ColumnMode, DatatableComponent, NgxDatatableModule } from '@siemens/ngx-datatable';
import { CompagniePetroliereService } from '../../../../core/services/compagnie-petroliere/compagnie-petroliere.service';
import { CompagniePetroliere } from '../../../../core/services/interface/models';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule  } from "@angular/forms";
import { CommonModule } from '@angular/common';
import { NgbAlertModule } from '@ng-bootstrap/ng-bootstrap';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
declare var bootstrap: any;

@Component({
  selector: 'app-compagnie-petroliere',
  standalone: true,
  imports: [
    RouterLink,
    NgxDatatableModule,
    ReactiveFormsModule,
    CommonModule,
    NgbAlertModule,
    NgbDropdownModule
  ],
  templateUrl: 'compagnie-petroliere.component.html'
})
export class CompagniePetroliereComponent implements OnInit {

  rows: CompagniePetroliere[] = [];
  temp: CompagniePetroliere[] = [];
  loadingIndicator = true;
  reorderable = true;
  ColumnMode = ColumnMode;

  alertAjoutVisible: boolean = false;  // Pour gérer la visibilité de l'alerte ajout
  alertModifVisible: boolean = false;  // Pour gérer la visibilité de l'alerte mofid
  alertSuppVisible: boolean = false;  // Pour gérer la visibilité de l'alerte supp

  public addCompagniePetroliere!: FormGroup ;
  public editCompagniePetroliere!: FormGroup ;
  public deleteCompagniePetroliere!: FormGroup ;

  @ViewChild('table') table!: DatatableComponent;

  constructor(private compagniePetroliereService: CompagniePetroliereService, private formBuilder: FormBuilder,) {}

  ngOnInit(): void {
    this.loadCompagniePetrolieres();
    this.addCompagniePetroliere = this.formBuilder.group({
      libelle: ["", [Validators.required]],
      adresse: ["", [Validators.required]],
   });
    this.editCompagniePetroliere = this.formBuilder.group({
      id: [0, [Validators.required]],
      libelle: ["", [Validators.required]],
      adresse: ["", [Validators.required]],
   });
    this.deleteCompagniePetroliere = this.formBuilder.group({
      id: [0, [Validators.required]],
   });
  }
  onClickSubmitAddCompagniePetroliere() {
  console.log(this.addCompagniePetroliere.value);
  const spinner = document.querySelector('.spinner-border');

  if (this.addCompagniePetroliere.valid) {
    if (spinner) spinner.classList.remove('d-none');
    this.compagniePetroliereService.saveCompagniePetroliere(this.addCompagniePetroliere.value).subscribe(
      (data: any) => {
        this.loadCompagniePetrolieres();
        if (spinner) spinner.classList.add('d-none');
        this.addCompagniePetroliere.reset();

        // Fermer le modal manuellement
        const modal = document.getElementById('add_compagniePetroliere');
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
        console.error('Erreur lors de l\'ajout de la CompagniePetroliere :', error);
        if (spinner) spinner.classList.add('d-none');
        alert('Une erreur s\'est produite. Veuillez réessayer.');
      }
    );
  } else {
    if (spinner) spinner.classList.add('d-none');
    alert("Désolé, le formulaire n'est pas bien renseigné");
  }
}

onClickSubmitEditCompagniePetroliere(){
  console.log(this.editCompagniePetroliere.value);
  const spinner = document.querySelector('.spinnerModif');

  if (this.editCompagniePetroliere.valid) {
    if (spinner) spinner.classList.remove('d-none');
    const id = this.editCompagniePetroliere.value.id;
    this.compagniePetroliereService.editCompagniePetroliere(this.editCompagniePetroliere.value).subscribe(
      (data: any) => {
        this.loadCompagniePetrolieres();
        if (spinner) spinner.classList.add('d-none');
        this.editCompagniePetroliere.reset();

        // Fermer le modal manuellement
        const modal = document.getElementById('edit_compagniePetroliere');
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
        console.error('Erreur lors de la modification de la CompagniePetroliere :', error);
        if (spinner) spinner.classList.add('d-none');
        alert('Une erreur s\'est produite. Veuillez réessayer.');
      }
    );
  } else {
    if (spinner) spinner.classList.add('d-none');
    alert("Désolé, le formulaire n'est pas bien renseigné");
  }
}

onClickSubmitDeleteCompagniePetroliere(){
  console.log(this.deleteCompagniePetroliere.value);
  const spinner = document.querySelector('.spinnerDelete');

  if (this.deleteCompagniePetroliere.valid) {
    if (spinner) spinner.classList.remove('d-none');
    this.compagniePetroliereService.deleteCompagniePetroliere(this.deleteCompagniePetroliere.value).subscribe(
      (data: any) => {
        this.loadCompagniePetrolieres();
        if (spinner) spinner.classList.add('d-none');
        this.deleteCompagniePetroliere.reset();

        // Fermer le modal manuellement
        const modal = document.getElementById('delete_compagniePetroliere');
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
        console.error('Erreur lors de la supression de la CompagniePetroliere :', error);
        if (spinner) spinner.classList.add('d-none');
        alert('Une erreur s\'est produite. Veuillez réessayer.');
      }
    );
  } else {
    if (spinner) spinner.classList.add('d-none');
    alert("Désolé, le formulaire n'est pas bien renseigné");
  }
}



loadCompagniePetrolieres(): void {
    this.compagniePetroliereService.getAllCompagniePetrolieres().subscribe(
      (data: CompagniePetroliere[]) => {
        this.temp = [...data]; // Sauvegarde de la liste complète pour la recherche
        this.rows = data;
        this.loadingIndicator = false;
      },
      error => {
        console.error('Erreur lors du chargement des CompagniePetroliere', error);
        this.loadingIndicator = false;
      }
    );
  }

  updateFilter(event: KeyboardEvent): void {
    const val = (event.target as HTMLInputElement).value.toLowerCase();

    this.rows = this.temp.filter(compagniePetroliere =>
      compagniePetroliere.libelle.toLowerCase().includes(val)
    );

    this.table.offset = 0;
  }

  getEditForm(row: any){
    this.editCompagniePetroliere.patchValue({
     id:row.id,
     libelle:row.libelle,
     adresse:row.adresse
    })
  }

  getDeleteForm(row: any){
    this.deleteCompagniePetroliere.patchValue({
     id:row.id,
    })
  }
}


