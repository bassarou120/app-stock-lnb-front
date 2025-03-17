import { Component, ViewChild, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ColumnMode, DatatableComponent, NgxDatatableModule } from '@siemens/ngx-datatable';
import { ArticleService } from '../../../core/services/articles/articles.service';
import { Categorie, Article } from '../../../core/services/interface/models';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule,FormArray  } from "@angular/forms";
import { CommonModule } from '@angular/common';
import { NgbAlertModule } from '@ng-bootstrap/ng-bootstrap';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { NgSelectComponent as MyNgSelectComponent } from '@ng-select/ng-select';
declare var bootstrap: any;

@Component({
  selector: 'app-articles',
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
  templateUrl: 'articles.component.html'
})
export class ArticlesComponent implements OnInit {

  rows: Article[] = [];
  temp: Article[] = [];
  loadingIndicator = true;
  reorderable = true;
  ColumnMode = ColumnMode;

  categories: Categorie[] = []; // Liste des types d'immos
  selectedCategorieId: number | null = null; // ID sélectionné

  alertAjoutVisible: boolean = false;  // Pour gérer la visibilité de l'alerte ajout
  alertModifVisible: boolean = false;  // Pour gérer la visibilité de l'alerte mofid
  alertSuppVisible: boolean = false;  // Pour gérer la visibilité de l'alerte supp

  public addArticle!: FormGroup ;
  public editArticle!: FormGroup ;
  public deleteArticle!: FormGroup ;

  @ViewChild('table') table!: DatatableComponent;

  constructor(private articleService: ArticleService,private formBuilder: FormBuilder,) {}

  ngOnInit(): void {
    this.loadCategories();
    this.loadArticles();
    this.initForm();

    this.editArticle = this.formBuilder.group({
      id: [0, [Validators.required]],
      libelle: ["", [Validators.required]],
      id_cat: [null, [Validators.required]],
      description: ["" ,[Validators.required]],
   });
    this.deleteArticle = this.formBuilder.group({
      id: [0, [Validators.required]],
   });
  }

  initForm(): void {
    this.addArticle = this.formBuilder.group({
      articles: this.formBuilder.array([this.createArticleFormGroup()])
    });
  }
  // Getter pour accéder facilement au FormArray
  get articlesArray(): FormArray {
    return this.addArticle.get('articles') as FormArray;
  }
  // Méthode pour créer un groupe de formulaire pour un seul article
  createArticleFormGroup(): FormGroup {
    return this.formBuilder.group({
      libelle: ['', [Validators.required]],
      id_cat: [null, [Validators.required]],
      description: ['', [Validators.required]]
    });
  }
  // Ajouter un nouveau groupe d'article
  addNewArticle(): void {
    this.articlesArray.push(this.createArticleFormGroup());
  }
  // Supprimer un article
  removeArticle(index: number): void {
    if (this.articlesArray.length > 1) {
      this.articlesArray.removeAt(index);
    }
  }
  onClickSubmitAddArticles(): void {
    console.log(this.addArticle.value);
    const spinner = document.querySelector('.spinner-border');

    if (this.addArticle.valid) {
      if (spinner) spinner.classList.remove('d-none');
      
      // Convertir le FormArray en un tableau d'articles à envoyer
      const articlesToSave = this.articlesArray.value;
      
      // Créer un observable pour sauvegarder tous les articles
      this.articleService.saveMultipleArticles(articlesToSave).subscribe(
        (data: any) => {
          this.loadArticles();
          if (spinner) spinner.classList.add('d-none');
          this.initForm(); // Réinitialiser le formulaire avec un seul article vide

          // Fermer le modal manuellement
          const modal = document.getElementById('add_article');
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
          console.error('Erreur lors de l\'ajout des Articles :', error);
          if (spinner) spinner.classList.add('d-none');
          alert('Une erreur s\'est produite. Veuillez réessayer.');
        }
      );
    } else {
      if (spinner) spinner.classList.add('d-none');
      alert("Désolé, le formulaire n'est pas bien renseigné");
    }
  }


//   onClickSubmitAddArticle() {
//   console.log(this.addArticle.value);
//   const spinner = document.querySelector('.spinner-border');

//   if (this.addArticle.valid) {
//     if (spinner) spinner.classList.remove('d-none');
//     this.articleService.saveArticle(this.addArticle.value).subscribe(
//       (data: any) => {
//         this.loadArticles();
//         if (spinner) spinner.classList.add('d-none');
//         this.addArticle.reset();

//         // Fermer le modal manuellement
//         const modal = document.getElementById('add_article');
//         // @ts-ignore - pour éviter les erreurs TypeScript
//         const bsModal = bootstrap.Modal.getInstance(modal);
//         bsModal?.hide();

//         // Attendre que le modal soit fermé avant d'afficher l'alerte
//         setTimeout(() => {
//           this.alertAjoutVisible = true;
//           console.log('Alert visible après fermeture du modal:', this.alertAjoutVisible);

//           // Utilisation de la transition pour faire apparaitre l'alerte
//           setTimeout(() => {
//             this.alertAjoutVisible = false;
//           }, 2000); // L'alerte disparaît après 2 secondes
//         }, 200); // L'alerte apparaît 200ms après la fermeture du modal
//       },
//       (error: any) => {
//         console.error('Erreur lors de l\'ajout de l\'Article :', error);
//         if (spinner) spinner.classList.add('d-none');
//         alert('Une erreur s\'est produite. Veuillez réessayer.');
//       }
//     );
//   } else {
//     if (spinner) spinner.classList.add('d-none');
//     alert("Désolé, le formulaire n'est pas bien renseigné");
//   }
// }

onClickSubmitEditArticle(){
  console.log(this.editArticle.value);
  const spinner = document.querySelector('.spinnerModif');

  if (this.editArticle.valid) {
    if (spinner) spinner.classList.remove('d-none');
    const id = this.editArticle.value.id;
    this.articleService.editArticle(this.editArticle.value).subscribe(
      (data: any) => {
        this.loadArticles();
        if (spinner) spinner.classList.add('d-none');
        this.editArticle.reset();

        // Fermer le modal manuellement
        const modal = document.getElementById('edit_article');
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
        console.error('Erreur lors de la modification de l\'Article :', error);
        if (spinner) spinner.classList.add('d-none');
        alert('Une erreur s\'est produite. Veuillez réessayer.');
      }
    );
  } else {
    if (spinner) spinner.classList.add('d-none');
    alert("Désolé, le formulaire n'est pas bien renseigné");
  }
}

onClickSubmitDeleteArticle(){
  console.log(this.deleteArticle.value);
  const spinner = document.querySelector('.spinnerDelete');

  if (this.deleteArticle.valid) {
    if (spinner) spinner.classList.remove('d-none');
    this.articleService.deleteArticle(this.deleteArticle.value).subscribe(
      (data: any) => {
        this.loadArticles();
        if (spinner) spinner.classList.add('d-none');
        this.deleteArticle.reset();

        // Fermer le modal manuellement
        const modal = document.getElementById('delete_article');
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
        console.error('Erreur lors de la supression de l\'Article :', error);
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
  this.articleService.getAllCategories().subscribe({
    next: (data) => {
      this.categories = data; // Stocker la liste des categories
    },
    error: (err) => {
      console.error("Erreur lors du chargement des categories :", err);
    }
  });
}


loadArticles(): void {
    this.articleService.getAllArticles().subscribe(
      (data: Article[]) => {
        this.temp = [...data]; // Sauvegarde de la liste complète pour la recherche
        this.rows = data;
        this.loadingIndicator = false;
      },
      error => {
        console.error('Erreur lors du chargement des Articles', error);
        this.loadingIndicator = false;
      }
    );
  }

  updateFilter(event: KeyboardEvent): void {
    const val = (event.target as HTMLInputElement).value.toLowerCase();

    this.rows = this.temp.filter(article =>
      article.libelle.toLowerCase().includes(val)
    );

    this.table.offset = 0;
  }

  getEditForm(row: any){
    this.editArticle.patchValue({
     id:row.id,
     id_cat:row.id_cat,
     libelle:row.libelle,
     description:row.description,
    })
  }

  getDeleteForm(row: any){
    this.deleteArticle.patchValue({
     id:row.id,
    })
  }
 }


