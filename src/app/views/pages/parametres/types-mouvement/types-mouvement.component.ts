import { Component, ViewChild, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ColumnMode, DatatableComponent, NgxDatatableModule } from '@siemens/ngx-datatable';
import { TypeMouvementService } from '../../../../core/services/types-mouvement/types-mouvement.service';
import { TypeMouvement } from '../../../../core/services/interface/models';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule  } from "@angular/forms";
import { CommonModule } from '@angular/common';
import { NgbAlertModule } from '@ng-bootstrap/ng-bootstrap';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
declare var bootstrap: any;

@Component({
  selector: 'app-types-mouvement',
  standalone: true,
  imports: [
    RouterLink,
    NgxDatatableModule,
    ReactiveFormsModule,
    CommonModule,
    NgbAlertModule,
    NgbDropdownModule
  ],
  templateUrl: 'types-mouvement.component.html'
})
export class TypeMouvementComponent implements OnInit {

  rows: TypeMouvement[] = [];
  temp: TypeMouvement[] = [];
  loadingIndicator = true;
  reorderable = true;
  ColumnMode = ColumnMode;

  alertAjoutVisible: boolean = false;  // Pour gérer la visibilité de l'alerte ajout
  alertModifVisible: boolean = false;  // Pour gérer la visibilité de l'alerte mofid
  alertSuppVisible: boolean = false;  // Pour gérer la visibilité de l'alerte supp

  public addTypeMouvement!: FormGroup ;
  public editTypeMouvement!: FormGroup ;
  public deleteTypeMouvement!: FormGroup ;

  @ViewChild('table') table!: DatatableComponent;

  constructor(private typeMouvementService: TypeMouvementService, private formBuilder: FormBuilder,) {}

  ngOnInit(): void {
    this.loadTypeMouvements();
    this.addTypeMouvement = this.formBuilder.group({
      libelle_type_mouvement: ["", [Validators.required]],
   });
    this.editTypeMouvement = this.formBuilder.group({
      id: [0, [Validators.required]],
      libelle_type_mouvement: ["", [Validators.required]],
   });
    this.deleteTypeMouvement = this.formBuilder.group({
      id: [0, [Validators.required]],
   });
  }
  onClickSubmitAddTypeMouvement() {
  console.log(this.addTypeMouvement.value);
  const spinner = document.querySelector('.spinner-border');

  if (this.addTypeMouvement.valid) {
    if (spinner) spinner.classList.remove('d-none');
    this.typeMouvementService.saveTypeMouvement(this.addTypeMouvement.value).subscribe(
      (data: any) => {
        this.loadTypeMouvements();
        if (spinner) spinner.classList.add('d-none');
        this.addTypeMouvement.reset();

        // Fermer le modal manuellement
        const modal = document.getElementById('add_typeMouvement');
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
        console.error('Erreur lors de l\'ajout du TypeMouvement :', error);
        if (spinner) spinner.classList.add('d-none');
        alert('Une erreur s\'est produite. Veuillez réessayer.');
      }
    );
  } else {
    if (spinner) spinner.classList.add('d-none');
    alert("Désolé, le formulaire n'est pas bien renseigné");
  }
}

onClickSubmitEditTypeMouvement(){
  console.log(this.editTypeMouvement.value);
  const spinner = document.querySelector('.spinnerModif');

  if (this.editTypeMouvement.valid) {
    if (spinner) spinner.classList.remove('d-none');
    const id = this.editTypeMouvement.value.id;
    this.typeMouvementService.editTypeMouvement(this.editTypeMouvement.value).subscribe(
      (data: any) => {
        this.loadTypeMouvements();
        if (spinner) spinner.classList.add('d-none');
        this.editTypeMouvement.reset();

        // Fermer le modal manuellement
        const modal = document.getElementById('edit_typeMouvement');
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
        console.error('Erreur lors de la modification du TypeMouvement :', error);
        if (spinner) spinner.classList.add('d-none');
        alert('Une erreur s\'est produite. Veuillez réessayer.');
      }
    );
  } else {
    if (spinner) spinner.classList.add('d-none');
    alert("Désolé, le formulaire n'est pas bien renseigné");
  }
}

onClickSubmitDeleteTypeMouvement(){
  console.log(this.deleteTypeMouvement.value);
  const spinner = document.querySelector('.spinnerDelete');

  if (this.deleteTypeMouvement.valid) {
    if (spinner) spinner.classList.remove('d-none');
    this.typeMouvementService.deleteTypeMouvement(this.deleteTypeMouvement.value).subscribe(
      (data: any) => {
        this.loadTypeMouvements();
        if (spinner) spinner.classList.add('d-none');
        this.deleteTypeMouvement.reset();

        // Fermer le modal manuellement
        const modal = document.getElementById('delete_typeMouvement');
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
        console.error('Erreur lors de la supression du TypeMouvement  :', error);
        if (spinner) spinner.classList.add('d-none');
        alert('Une erreur s\'est produite. Veuillez réessayer.');
      }
    );
  } else {
    if (spinner) spinner.classList.add('d-none');
    alert("Désolé, le formulaire n'est pas bien renseigné");
  }
}



  loadTypeMouvements(): void {
    this.typeMouvementService.getAllTypeMouvement().subscribe(
      (data: TypeMouvement[]) => {
        this.temp = [...data]; // Sauvegarde de la liste complète pour la recherche
        this.rows = data;
        this.loadingIndicator = false;
      },
      error => {
        console.error('Erreur lors du chargement des Type Mouvements', error);
        this.loadingIndicator = false;
      }
    );
  }

  updateFilter(event: KeyboardEvent): void {
    const val = (event.target as HTMLInputElement).value.toLowerCase();

    this.rows = this.temp.filter(typeMouvement =>
      typeMouvement.libelle_type_mouvement.toLowerCase().includes(val)
    );

    this.table.offset = 0;
  }

  getEditForm(row: any){
    this.editTypeMouvement.patchValue({
     id:row.id,
     libelle_type_mouvement:row.libelle_type_mouvement,
     valeur:row.valeur
    })
  }

  getDeleteForm(row: any){
    this.deleteTypeMouvement.patchValue({
     id:row.id,
    })
  }
}


