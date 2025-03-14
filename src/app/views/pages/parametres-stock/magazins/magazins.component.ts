import { Component, ViewChild, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ColumnMode, DatatableComponent, NgxDatatableModule } from '@siemens/ngx-datatable';
import { MagazinsService } from '../../../../core/services/magazins/magazins.service';
import { Magazin } from '../../../../core/services/interface/models';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule  } from "@angular/forms";
import { CommonModule } from '@angular/common';
import { NgbAlertModule } from '@ng-bootstrap/ng-bootstrap';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
declare var bootstrap: any;

@Component({
  selector: 'app-magazins',
  standalone: true,
  imports: [
    RouterLink,
    NgxDatatableModule,
    ReactiveFormsModule,
    CommonModule,
    NgbAlertModule,
    NgbDropdownModule
  ],
  templateUrl: 'magazins.component.html'
})
export class MagazinsComponent implements OnInit {

  rows: Magazin[] = [];
  temp: Magazin[] = [];
  loadingIndicator = true;
  reorderable = true;
  ColumnMode = ColumnMode;

  alertAjoutVisible: boolean = false;  // Pour gérer la visibilité de l'alerte ajout
  alertModifVisible: boolean = false;  // Pour gérer la visibilité de l'alerte mofid
  alertSuppVisible: boolean = false;  // Pour gérer la visibilité de l'alerte supp

  public addMagazin!: FormGroup ;
  public editMagazin!: FormGroup ;
  public deleteMagazin!: FormGroup ;

  @ViewChild('table') table!: DatatableComponent;

  constructor(private magazinsService: MagazinsService, private formBuilder: FormBuilder,) {}

  ngOnInit(): void {
    this.loadMagazins();
    this.addMagazin = this.formBuilder.group({
      libelle_magazin: ["", [Validators.required]],
      localisation: ["", [Validators.required]],
   });
    this.editMagazin = this.formBuilder.group({
      id: [0, [Validators.required]],
      libelle_magazin: ["", [Validators.required]],
      localisation: ["", [Validators.required]],
   });
    this.deleteMagazin = this.formBuilder.group({
      id: [0, [Validators.required]],
   });
  }
  onClickSubmitAddMagazin() {
  console.log(this.addMagazin.value);
  const spinner = document.querySelector('.spinner-border');

  if (this.addMagazin.valid) {
    if (spinner) spinner.classList.remove('d-none');
    this.magazinsService.saveMagazin(this.addMagazin.value).subscribe(
      (data: any) => {
        this.loadMagazins();
        if (spinner) spinner.classList.add('d-none');
        this.addMagazin.reset();

        // Fermer le modal manuellement
        const modal = document.getElementById('add_magazin');
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
        console.error('Erreur lors de l\'ajout du magazin :', error);
        if (spinner) spinner.classList.add('d-none');
        alert('Une erreur s\'est produite. Veuillez réessayer.');
      }
    );
  } else {
    if (spinner) spinner.classList.add('d-none');
    alert("Désolé, le formulaire n'est pas bien renseigné");
  }
}

onClickSubmitEditMagazin(){
  console.log(this.editMagazin.value);
  const spinner = document.querySelector('.spinnerModif');

  if (this.editMagazin.valid) {
    if (spinner) spinner.classList.remove('d-none');
    const id = this.editMagazin.value.id;
    this.magazinsService.editMagazin(this.editMagazin.value).subscribe(
      (data: any) => {
        this.loadMagazins();
        if (spinner) spinner.classList.add('d-none');
        this.editMagazin.reset();

        // Fermer le modal manuellement
        const modal = document.getElementById('edit_magazin');
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
        console.error('Erreur lors de la modification du magazin :', error);
        if (spinner) spinner.classList.add('d-none');
        alert('Une erreur s\'est produite. Veuillez réessayer.');
      }
    );
  } else {
    if (spinner) spinner.classList.add('d-none');
    alert("Désolé, le formulaire n'est pas bien renseigné");
  }
}

onClickSubmitDeleteMagazin(){
  console.log(this.deleteMagazin.value);
  const spinner = document.querySelector('.spinnerDelete');

  if (this.deleteMagazin.valid) {
    if (spinner) spinner.classList.remove('d-none');
    this.magazinsService.deleteMagazin(this.deleteMagazin.value).subscribe(
      (data: any) => {
        this.loadMagazins();
        if (spinner) spinner.classList.add('d-none');
        this.deleteMagazin.reset();

        // Fermer le modal manuellement
        const modal = document.getElementById('delete_magazin');
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
        console.error('Erreur lors de la supression du magazin :', error);
        if (spinner) spinner.classList.add('d-none');
        alert('Une erreur s\'est produite. Veuillez réessayer.');
      }
    );
  } else {
    if (spinner) spinner.classList.add('d-none');
    alert("Désolé, le formulaire n'est pas bien renseigné");
  }
}



loadMagazins(): void {
    this.magazinsService.getAllMagazins().subscribe(
      (data: Magazin[]) => {
        this.temp = [...data]; // Sauvegarde de la liste complète pour la recherche
        this.rows = data;
        this.loadingIndicator = false;
      },
      error => {
        console.error('Erreur lors du chargement des Magazin', error);
        this.loadingIndicator = false;
      }
    );
  }

  updateFilter(event: KeyboardEvent): void {
    const val = (event.target as HTMLInputElement).value.toLowerCase();

    this.rows = this.temp.filter(magazin =>
      magazin.libelle_magazin.toLowerCase().includes(val)
    );

    this.table.offset = 0;
  }

  getEditForm(row: any){
    this.editMagazin.patchValue({
     id:row.id,
     libelle_magazin:row.libelle_magazin,
     localisation:row.localisation
    })
  }

  getDeleteForm(row: any){
    this.deleteMagazin.patchValue({
     id:row.id,
    })
  }
}


