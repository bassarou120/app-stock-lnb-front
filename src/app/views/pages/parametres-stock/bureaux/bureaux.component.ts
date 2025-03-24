import { Component, ViewChild, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ColumnMode, DatatableComponent, NgxDatatableModule } from '@siemens/ngx-datatable';
import { BureauxService } from '../../../../core/services/bureaux/bureaux.service';
import { Bureau } from '../../../../core/services/interface/models';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule  } from "@angular/forms";
import { CommonModule } from '@angular/common';
import { NgbAlertModule } from '@ng-bootstrap/ng-bootstrap';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
declare var bootstrap: any;

@Component({
  selector: 'app-bureaux',
  standalone: true,
  imports: [
    RouterLink,
    NgxDatatableModule,
    ReactiveFormsModule,
    CommonModule,
    NgbAlertModule,
    NgbDropdownModule
  ],
  templateUrl: 'bureaux.component.html'
})
export class BureauxComponent implements OnInit {

  rows: Bureau[] = [];
  temp: Bureau[] = [];
  loadingIndicator = true;
  reorderable = true;
  ColumnMode = ColumnMode;

  alertAjoutVisible: boolean = false;  // Pour gérer la visibilité de l'alerte ajout
  alertModifVisible: boolean = false;  // Pour gérer la visibilité de l'alerte mofid
  alertSuppVisible: boolean = false;  // Pour gérer la visibilité de l'alerte supp

  public addBureau!: FormGroup ;
  public editBureau!: FormGroup ;
  public deleteBureau!: FormGroup ;

  @ViewChild('table') table!: DatatableComponent;

  constructor(private bureauxService: BureauxService, private formBuilder: FormBuilder,) {}

  ngOnInit(): void {
    this.loadBureaux();
    this.addBureau = this.formBuilder.group({
      libelle_bureau: ["", [Validators.required]],
      valeur: ["" ,[]],
   });
    this.editBureau = this.formBuilder.group({
      id: [0, [Validators.required]],
      libelle_bureau: ["", [Validators.required]],
      valeur: [0 ,[]],
   });
    this.deleteBureau = this.formBuilder.group({
      id: [0, [Validators.required]],
   });
  }
  onClickSubmitAddBureau() {
  console.log(this.addBureau.value);
  const spinner = document.querySelector('.spinner-border');

  if (this.addBureau.valid) {
    if (spinner) spinner.classList.remove('d-none');
    this.bureauxService.saveBureau(this.addBureau.value).subscribe(
      (data: any) => {
        this.loadBureaux();
        if (spinner) spinner.classList.add('d-none');
        this.addBureau.reset();

        // Fermer le modal manuellement
        const modal = document.getElementById('add_bureau');
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
        console.error('Erreur lors de l\'ajout du Bureau :', error);
        if (spinner) spinner.classList.add('d-none');
        alert('Une erreur s\'est produite. Veuillez réessayer.');
      }
    );
  } else {
    if (spinner) spinner.classList.add('d-none');
    alert("Désolé, le formulaire n'est pas bien renseigné");
  }
}

onClickSubmitEditBureau(){
  console.log(this.editBureau.value);
  const spinner = document.querySelector('.spinnerModif');

  if (this.editBureau.valid) {
    if (spinner) spinner.classList.remove('d-none');
    const id = this.editBureau.value.id;
    this.bureauxService.editBureau(this.editBureau.value).subscribe(
      (data: any) => {
        this.loadBureaux();
        if (spinner) spinner.classList.add('d-none');
        this.editBureau.reset();

        // Fermer le modal manuellement
        const modal = document.getElementById('edit_bureau');
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
        console.error('Erreur lors de la modification du Bureau :', error);
        if (spinner) spinner.classList.add('d-none');
        alert('Une erreur s\'est produite. Veuillez réessayer.');
      }
    );
  } else {
    if (spinner) spinner.classList.add('d-none');
    alert("Désolé, le formulaire n'est pas bien renseigné");
  }
}

onClickSubmitDeleteBureau(){
  console.log(this.deleteBureau.value);
  const spinner = document.querySelector('.spinnerDelete');

  if (this.deleteBureau.valid) {
    if (spinner) spinner.classList.remove('d-none');
    this.bureauxService.deleteBureau(this.deleteBureau.value).subscribe(
      (data: any) => {
        this.loadBureaux();
        if (spinner) spinner.classList.add('d-none');
        this.deleteBureau.reset();

        // Fermer le modal manuellement
        const modal = document.getElementById('delete_bureau');
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
        console.error('Erreur lors de la supression du Bureau :', error);
        if (spinner) spinner.classList.add('d-none');
        alert('Une erreur s\'est produite. Veuillez réessayer.');
      }
    );
  } else {
    if (spinner) spinner.classList.add('d-none');
    alert("Désolé, le formulaire n'est pas bien renseigné");
  }
}



loadBureaux(): void {
    this.bureauxService.getAllBureaux().subscribe(
      (data: Bureau[]) => {
        this.temp = [...data]; // Sauvegarde de la liste complète pour la recherche
        this.rows = data;
        this.loadingIndicator = false;
      },
      error => {
        console.error('Erreur lors du chargement des Bureaux', error);
        this.loadingIndicator = false;
      }
    );
  }

  updateFilter(event: KeyboardEvent): void {
    const val = (event.target as HTMLInputElement).value.toLowerCase();

    this.rows = this.temp.filter(bureau =>
      bureau.libelle_bureau.toLowerCase().includes(val)
    );

    this.table.offset = 0;
  }

  getEditForm(row: any){
    this.editBureau.patchValue({
     id:row.id,
     libelle_bureau:row.libelle_bureau,
     valeur:row.valeur,
    })
  }

  getDeleteForm(row: any){
    this.deleteBureau.patchValue({
     id:row.id,
    })
  }
}


