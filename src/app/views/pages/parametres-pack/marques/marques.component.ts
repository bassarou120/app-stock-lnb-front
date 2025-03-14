import { Component, ViewChild, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ColumnMode, DatatableComponent, NgxDatatableModule } from '@siemens/ngx-datatable';
import { MarquesService } from '../../../../core/services/marques/marques.service';
import { Marque } from '../../../../core/services/interface/models';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule  } from "@angular/forms";
import { CommonModule } from '@angular/common';
import { NgbAlertModule } from '@ng-bootstrap/ng-bootstrap';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
declare var bootstrap: any;

@Component({
  selector: 'app-marques',
  standalone: true,
  imports: [
    RouterLink,
    NgxDatatableModule,
    ReactiveFormsModule,
    CommonModule,
    NgbAlertModule,
    NgbDropdownModule
  ],
  templateUrl: 'marques.component.html'
})
export class MarquesComponent implements OnInit {

  rows: Marque[] = [];
  temp: Marque[] = [];
  loadingIndicator = true;
  reorderable = true;
  ColumnMode = ColumnMode;

  alertAjoutVisible: boolean = false;  // Pour gérer la visibilité de l'alerte ajout
  alertModifVisible: boolean = false;  // Pour gérer la visibilité de l'alerte mofid
  alertSuppVisible: boolean = false;  // Pour gérer la visibilité de l'alerte supp

  public addMarque!: FormGroup ;
  public editMarque!: FormGroup ;
  public deleteMarque!: FormGroup ;

  @ViewChild('table') table!: DatatableComponent;

  constructor(private marquesService: MarquesService, private formBuilder: FormBuilder,) {}

  ngOnInit(): void {
    this.loadMarques();
    this.addMarque = this.formBuilder.group({
      libelle: ["", [Validators.required]],
   });
    this.editMarque = this.formBuilder.group({
      id: [0, [Validators.required]],
      libelle: ["", [Validators.required]],
   });
    this.deleteMarque = this.formBuilder.group({
      id: [0, [Validators.required]],
   });
  }
  onClickSubmitAddMarque() {
  console.log(this.addMarque.value);
  const spinner = document.querySelector('.spinner-border');

  if (this.addMarque.valid) {
    if (spinner) spinner.classList.remove('d-none');
    this.marquesService.saveMarque(this.addMarque.value).subscribe(
      (data: any) => {
        this.loadMarques();
        if (spinner) spinner.classList.add('d-none');
        this.addMarque.reset();

        // Fermer le modal manuellement
        const modal = document.getElementById('add_marque');
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
        console.error('Erreur lors de l\'ajout de la Marque :', error);
        if (spinner) spinner.classList.add('d-none');
        alert('Une erreur s\'est produite. Veuillez réessayer.');
      }
    );
  } else {
    if (spinner) spinner.classList.add('d-none');
    alert("Désolé, le formulaire n'est pas bien renseigné");
  }
}

onClickSubmitEditMarque(){
  console.log(this.editMarque.value);
  const spinner = document.querySelector('.spinnerModif');

  if (this.editMarque.valid) {
    if (spinner) spinner.classList.remove('d-none');
    const id = this.editMarque.value.id;
    this.marquesService.editMarque(this.editMarque.value).subscribe(
      (data: any) => {
        this.loadMarques();
        if (spinner) spinner.classList.add('d-none');
        this.editMarque.reset();

        // Fermer le modal manuellement
        const modal = document.getElementById('edit_marque');
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
        console.error('Erreur lors de la modification de la Marque :', error);
        if (spinner) spinner.classList.add('d-none');
        alert('Une erreur s\'est produite. Veuillez réessayer.');
      }
    );
  } else {
    if (spinner) spinner.classList.add('d-none');
    alert("Désolé, le formulaire n'est pas bien renseigné");
  }
}

onClickSubmitDeleteMarque(){
  console.log(this.deleteMarque.value);
  const spinner = document.querySelector('.spinnerDelete');

  if (this.deleteMarque.valid) {
    if (spinner) spinner.classList.remove('d-none');
    this.marquesService.deleteMarque(this.deleteMarque.value).subscribe(
      (data: any) => {
        this.loadMarques();
        if (spinner) spinner.classList.add('d-none');
        this.deleteMarque.reset();

        // Fermer le modal manuellement
        const modal = document.getElementById('delete_marque');
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
        console.error('Erreur lors de la supression de la marque :', error);
        if (spinner) spinner.classList.add('d-none');
        alert('Une erreur s\'est produite. Veuillez réessayer.');
      }
    );
  } else {
    if (spinner) spinner.classList.add('d-none');
    alert("Désolé, le formulaire n'est pas bien renseigné");
  }
}



loadMarques(): void {
    this.marquesService.getAllMarques().subscribe(
      (data: Marque[]) => {
        this.temp = [...data]; // Sauvegarde de la liste complète pour la recherche
        this.rows = data;
        this.loadingIndicator = false;
      },
      error => {
        console.error('Erreur lors du chargement des marques', error);
        this.loadingIndicator = false;
      }
    );
  }

  updateFilter(event: KeyboardEvent): void {
    const val = (event.target as HTMLInputElement).value.toLowerCase();

    this.rows = this.temp.filter(marque =>
      marque.libelle.toLowerCase().includes(val)
    );

    this.table.offset = 0;
  }

  getEditForm(row: any){
    this.editMarque.patchValue({
     id:row.id,
     libelle:row.libelle
    })
  }

  getDeleteForm(row: any){
    this.deleteMarque.patchValue({
     id:row.id,
    })
  }
}


