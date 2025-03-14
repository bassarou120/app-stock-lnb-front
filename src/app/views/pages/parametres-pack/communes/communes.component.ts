import { Component, ViewChild, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ColumnMode, DatatableComponent, NgxDatatableModule } from '@siemens/ngx-datatable';
import { CommunesService } from '../../../../core/services/communes/communes.service';
import { Commune } from '../../../../core/services/interface/models';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule  } from "@angular/forms";
import { CommonModule } from '@angular/common';
import { NgbAlertModule } from '@ng-bootstrap/ng-bootstrap';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
declare var bootstrap: any;

@Component({
  selector: 'app-communes',
  standalone: true,
  imports: [
    RouterLink,
    NgxDatatableModule,
    ReactiveFormsModule,
    CommonModule,
    NgbAlertModule,
    NgbDropdownModule 
  ],
  templateUrl: 'communes.component.html'
})
export class CommunesComponent implements OnInit {

  rows: Commune[] = [];
  temp: Commune[] = [];
  loadingIndicator = true;
  reorderable = true;
  ColumnMode = ColumnMode;

  alertAjoutVisible: boolean = false;  // Pour gérer la visibilité de l'alerte ajout
  alertModifVisible: boolean = false;  // Pour gérer la visibilité de l'alerte mofid
  alertSuppVisible: boolean = false;  // Pour gérer la visibilité de l'alerte supp

  public addCommune!: FormGroup ;
  public editCommune!: FormGroup ;
  public deleteCommune!: FormGroup ;

  @ViewChild('table') table!: DatatableComponent;

  constructor(private communesService: CommunesService, private formBuilder: FormBuilder,) {}

  ngOnInit(): void {
    this.loadCommunes();
    this.addCommune = this.formBuilder.group({
      libelle_commune: ["", [Validators.required]],
   });
    this.editCommune = this.formBuilder.group({
      id: [0, [Validators.required]],
      libelle_commune: ["", [Validators.required]],
   });
    this.deleteCommune = this.formBuilder.group({
      id: [0, [Validators.required]],
   });
  }
  onClickSubmitAddCommune() {
  console.log(this.addCommune.value);
  const spinner = document.querySelector('.spinner-border');

  if (this.addCommune.valid) {
    if (spinner) spinner.classList.remove('d-none');
    this.communesService.saveCommune(this.addCommune.value).subscribe(
      (data: any) => {
        this.loadCommunes();
        if (spinner) spinner.classList.add('d-none');
        this.addCommune.reset();

        // Fermer le modal manuellement
        const modal = document.getElementById('add_commune');
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

onClickSubmitEditCommune(){
  console.log(this.editCommune.value);
  const spinner = document.querySelector('.spinnerModif');

  if (this.editCommune.valid) {
    if (spinner) spinner.classList.remove('d-none');
    const id = this.editCommune.value.id;
    this.communesService.editCommune(this.editCommune.value).subscribe(
      (data: any) => {
        this.loadCommunes();
        if (spinner) spinner.classList.add('d-none');
        this.editCommune.reset();

        // Fermer le modal manuellement
        const modal = document.getElementById('edit_commune');
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
        console.error('Erreur lors de la modification de la commune :', error);
        if (spinner) spinner.classList.add('d-none');
        alert('Une erreur s\'est produite. Veuillez réessayer.');
      }
    );
  } else {
    if (spinner) spinner.classList.add('d-none');
    alert("Désolé, le formulaire n'est pas bien renseigné");
  }
}

onClickSubmitDeleteCommune(){
  console.log(this.deleteCommune.value);
  const spinner = document.querySelector('.spinnerDelete');

  if (this.deleteCommune.valid) {
    if (spinner) spinner.classList.remove('d-none');
    this.communesService.deleteCommune(this.deleteCommune.value).subscribe(
      (data: any) => {
        this.loadCommunes();
        if (spinner) spinner.classList.add('d-none');
        this.deleteCommune.reset();

        // Fermer le modal manuellement
        const modal = document.getElementById('delete_commune');
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
        console.error('Erreur lors de la supression de la commune :', error);
        if (spinner) spinner.classList.add('d-none');
        alert('Une erreur s\'est produite. Veuillez réessayer.');
      }
    );
  } else {
    if (spinner) spinner.classList.add('d-none');
    alert("Désolé, le formulaire n'est pas bien renseigné");
  }
}

  

  loadCommunes(): void {
    this.communesService.getAllCommunes().subscribe(
      (data: Commune[]) => {
        this.temp = [...data]; // Sauvegarde de la liste complète pour la recherche
        this.rows = data;
        this.loadingIndicator = false;
      },
      error => {
        console.error('Erreur lors du chargement des communes', error);
        this.loadingIndicator = false;
      }
    );
  }

  updateFilter(event: KeyboardEvent): void {
    const val = (event.target as HTMLInputElement).value.toLowerCase();

    this.rows = this.temp.filter(commune =>
      commune.libelle_commune.toLowerCase().includes(val)
    );

    this.table.offset = 0;
  }

  getEditForm(row: any){
    this.editCommune.patchValue({
     id:row.id,
     libelle_commune:row.libelle_commune
    })
  }

  getDeleteForm(row: any){
    this.deleteCommune.patchValue({
     id:row.id,
    })
  }
}


