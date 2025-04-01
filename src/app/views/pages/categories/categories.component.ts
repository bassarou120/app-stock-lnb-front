import { Component, ViewChild, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ColumnMode, DatatableComponent, NgxDatatableModule } from '@siemens/ngx-datatable';
import { CategorieService } from '../../../core/services/categories/categories.service';
import { Categorie } from '../../../core/services/interface/models';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule  } from "@angular/forms";
import { CommonModule } from '@angular/common';
import { NgbAlertModule } from '@ng-bootstrap/ng-bootstrap';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
declare var bootstrap: any;

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [
    RouterLink,
    NgxDatatableModule,
    ReactiveFormsModule,
    CommonModule,
    NgbAlertModule,
    NgbDropdownModule
  ],
  templateUrl: 'categories.component.html'
})
export class CategorieComponent implements OnInit {

  rows: Categorie[] = [];
  temp: Categorie[] = [];
  loadingIndicator = true;
  reorderable = true;
  ColumnMode = ColumnMode;

  alertAjoutVisible: boolean = false;  // Pour gérer la visibilité de l'alerte ajout
  alertModifVisible: boolean = false;  // Pour gérer la visibilité de l'alerte mofid
  alertSuppVisible: boolean = false;  // Pour gérer la visibilité de l'alerte supp

  public addCategorie!: FormGroup ;
  public editCategorie!: FormGroup ;
  public deleteCategorie!: FormGroup ;

  @ViewChild('table') table!: DatatableComponent;

  constructor(private categorieService: CategorieService, private formBuilder: FormBuilder,) {}

  ngOnInit(): void {
    this.loadCategories();
    this.addCategorie = this.formBuilder.group({
      libelle_categorie_article: ["", [Validators.required]],
      // valeur: ["" ,[]],
      // taux: ["" ,[Validators.required]],
   });
    this.editCategorie = this.formBuilder.group({
      id: [0, [Validators.required]],
      libelle_categorie_article: ["", [Validators.required]],
      // valeur: ["" ,[]],
      // taux: ["" ,[Validators.required]],
   });
    this.deleteCategorie = this.formBuilder.group({
      id: [0, [Validators.required]],
   });
  }
  onClickSubmitAddCategorie() {
  console.log(this.addCategorie.value);
  const spinner = document.querySelector('.spinner-border');

  if (this.addCategorie.valid) {
    if (spinner) spinner.classList.remove('d-none');
    this.categorieService.saveCategorie(this.addCategorie.value).subscribe(
      (data: any) => {
        this.loadCategories();
        if (spinner) spinner.classList.add('d-none');
        this.addCategorie.reset();

        // Fermer le modal manuellement
        const modal = document.getElementById('add_categorie');
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
        console.error('Erreur lors de l\'ajout de la Categorie :', error);
        if (spinner) spinner.classList.add('d-none');
        alert('Une erreur s\'est produite. Veuillez réessayer.');
      }
    );
  } else {
    if (spinner) spinner.classList.add('d-none');
    alert("Désolé, le formulaire n'est pas bien renseigné");
  }
}

onClickSubmitEditCategorie(){
  console.log(this.editCategorie.value);
  const spinner = document.querySelector('.spinnerModif');

  if (this.editCategorie.valid) {
    if (spinner) spinner.classList.remove('d-none');
    const id = this.editCategorie.value.id;
    this.categorieService.editCategorie(this.editCategorie.value).subscribe(
      (data: any) => {
        this.loadCategories();
        if (spinner) spinner.classList.add('d-none');
        this.editCategorie.reset();

        // Fermer le modal manuellement
        const modal = document.getElementById('edit_categorie');
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
        console.error('Erreur lors de la modification du Categorie :', error);
        if (spinner) spinner.classList.add('d-none');
        alert('Une erreur s\'est produite. Veuillez réessayer.');
      }
    );
  } else {
    if (spinner) spinner.classList.add('d-none');
    alert("Désolé, le formulaire n'est pas bien renseigné");
  }
}

onClickSubmitDeleteCategorie(){
  console.log(this.deleteCategorie.value);
  const spinner = document.querySelector('.spinnerDelete');

  if (this.deleteCategorie.valid) {
    if (spinner) spinner.classList.remove('d-none');
    this.categorieService.deleteCategorie(this.deleteCategorie.value).subscribe(
      (data: any) => {
        this.loadCategories();
        if (spinner) spinner.classList.add('d-none');
        this.deleteCategorie.reset();

        // Fermer le modal manuellement
        const modal = document.getElementById('delete_categorie');
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
        console.error('Erreur lors de la supression du Categorie :', error);
        if (spinner) spinner.classList.add('d-none');
        alert('Une erreur s\'est produite. Veuillez réessayer.');
      }
    );
  } else {
    if (spinner) spinner.classList.add('d-none');
    alert("Désolé, le formulaire n'est pas bien renseigné");
  }
}



loadCategories(): void {
    this.categorieService.getAllCategories().subscribe(
      (data: Categorie[]) => {
        this.temp = [...data]; // Sauvegarde de la liste complète pour la recherche
        this.rows = data;
        this.loadingIndicator = false;
      },
      error => {
        console.error('Erreur lors du chargement des Categories', error);
        this.loadingIndicator = false;
      }
    );
  }

  updateFilter(event: KeyboardEvent): void {
    const val = (event.target as HTMLInputElement).value.toLowerCase();

    this.rows = this.temp.filter(categorie =>
      categorie.libelle_categorie_article.toLowerCase().includes(val)
    );

    this.table.offset = 0;
  }

  getEditForm(row: any){
    this.editCategorie.patchValue({
     id:row.id,
     libelle_categorie_article:row.libelle_categorie_article,
     valeur:row.valeur,
     taux:row.taux,
    })
  }

  getDeleteForm(row: any){
    this.deleteCategorie.patchValue({
     id:row.id,
    })
  }
}


