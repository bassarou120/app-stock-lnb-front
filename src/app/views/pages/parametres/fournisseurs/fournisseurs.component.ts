import { Component, ViewChild, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ColumnMode, DatatableComponent, NgxDatatableModule } from '@siemens/ngx-datatable';
import { FournisseursService } from '../../../../core/services/fournisseurs/fournisseurs.service';
import { Fournisseur } from '../../../../core/services/interface/models';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule  } from "@angular/forms";
import { CommonModule } from '@angular/common';
import { NgbAlertModule } from '@ng-bootstrap/ng-bootstrap';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
declare var bootstrap: any;

@Component({
  selector: 'app-fournisseurs',
  standalone: true,
  imports: [
    RouterLink,
    NgxDatatableModule,
    ReactiveFormsModule,
    CommonModule,
    NgbAlertModule,
    NgbDropdownModule
  ],
  templateUrl: 'fournisseurs.component.html'
})
export class FournisseursComponent implements OnInit {

  rows: Fournisseur[] = [];
  temp: Fournisseur[] = [];
  loadingIndicator = true;
  reorderable = true;
  ColumnMode = ColumnMode;

  alertAjoutVisible: boolean = false;  // Pour gérer la visibilité de l'alerte ajout
  alertModifVisible: boolean = false;  // Pour gérer la visibilité de l'alerte mofid
  alertSuppVisible: boolean = false;  // Pour gérer la visibilité de l'alerte supp

  public addFournisseur!: FormGroup ;
  public editFournisseur!: FormGroup ;
  public deleteFournisseur!: FormGroup ;

  @ViewChild('table') table!: DatatableComponent;

  constructor(private fournisseurService: FournisseursService, private formBuilder: FormBuilder,) {}

  ngOnInit(): void {
    this.loadFournisseurs();
    this.addFournisseur = this.formBuilder.group({
      nom: ["", [Validators.required]],
      telephone: ["", [Validators.required]],
      adresse: ["", [Validators.required]],
   });
    this.editFournisseur = this.formBuilder.group({
      id: [0, [Validators.required]],
      nom: ["", [Validators.required]],
      telephone: ["", [Validators.required]],
      adresse: ["", [Validators.required]],
   });
    this.deleteFournisseur = this.formBuilder.group({
      id: [0, [Validators.required]],
   });
  }
  onClickSubmitAddFournisseur() {
  console.log(this.addFournisseur.value);
  const spinner = document.querySelector('.spinner-border');

  if (this.addFournisseur.valid) {
    if (spinner) spinner.classList.remove('d-none');
    this.fournisseurService.saveFournisseur(this.addFournisseur.value).subscribe(
      (data: any) => {
        this.loadFournisseurs();
        if (spinner) spinner.classList.add('d-none');
        this.addFournisseur.reset();

        // Fermer le modal manuellement
        const modal = document.getElementById('add_fournisseur');
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
        console.error('Erreur lors de l\'ajout du Fournisseur :', error);
        if (spinner) spinner.classList.add('d-none');
        alert('Une erreur s\'est produite. Veuillez réessayer.');
      }
    );
  } else {
    if (spinner) spinner.classList.add('d-none');
    alert("Désolé, le formulaire n'est pas bien renseigné");
  }
}

onClickSubmitEditFournisseur(){
  console.log(this.editFournisseur.value);
  const spinner = document.querySelector('.spinnerModif');

  if (this.editFournisseur.valid) {
    if (spinner) spinner.classList.remove('d-none');
    const id = this.editFournisseur.value.id;
    this.fournisseurService.editFournisseur(this.editFournisseur.value).subscribe(
      (data: any) => {
        this.loadFournisseurs();
        if (spinner) spinner.classList.add('d-none');
        this.editFournisseur.reset();

        // Fermer le modal manuellement
        const modal = document.getElementById('edit_fournisseur');
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
        console.error('Erreur lors de la modification de la Fournisseur :', error);
        if (spinner) spinner.classList.add('d-none');
        alert('Une erreur s\'est produite. Veuillez réessayer.');
      }
    );
  } else {
    if (spinner) spinner.classList.add('d-none');
    alert("Désolé, le formulaire n'est pas bien renseigné");
  }
}

onClickSubmitDeleteFournisseur(){
  console.log(this.deleteFournisseur.value);
  const spinner = document.querySelector('.spinnerDelete');

  if (this.deleteFournisseur.valid) {
    if (spinner) spinner.classList.remove('d-none');
    this.fournisseurService.deleteFournisseur(this.deleteFournisseur.value).subscribe(
      (data: any) => {
        this.loadFournisseurs();
        if (spinner) spinner.classList.add('d-none');
        this.deleteFournisseur.reset();

        // Fermer le modal manuellement
        const modal = document.getElementById('delete_fournisseur');
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
        console.error('Erreur lors de la supression du Fournisseur :', error);
        if (spinner) spinner.classList.add('d-none');
        alert('Une erreur s\'est produite. Veuillez réessayer.');
      }
    );
  } else {
    if (spinner) spinner.classList.add('d-none');
    alert("Désolé, le formulaire n'est pas bien renseigné");
  }
}



loadFournisseurs(): void {
    this.fournisseurService.getAllFournisseurs().subscribe(
      (data: Fournisseur[]) => {
        this.temp = [...data]; // Sauvegarde de la liste complète pour la recherche
        this.rows = data;
        this.loadingIndicator = false;
      },
      error => {
        console.error('Erreur lors du chargement des Fournisseurs', error);
        this.loadingIndicator = false;
      }
    );
  }

  updateFilter(event: KeyboardEvent): void {
    const val = (event.target as HTMLInputElement).value.toLowerCase();

    this.rows = this.temp.filter(fournisseur =>
      fournisseur.nom.toLowerCase().includes(val)
    );

    this.table.offset = 0;
  }

  getEditForm(row: any){
    this.editFournisseur.patchValue({
     id:row.id,
     nom:row.nom,
     telephone:row.telephone,
     adresse:row.adresse

    })
  }

  getDeleteForm(row: any){
    this.deleteFournisseur.patchValue({
     id:row.id,
    })
  }
}


