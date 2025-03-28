import { Component, ViewChild, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ColumnMode, DatatableComponent, NgxDatatableModule } from '@siemens/ngx-datatable';
import { MouvementStockService } from '../../../../core/services/mouvementstock/entree.service';
import { MouvementStock, Article, Fournisseur } from '../../../../core/services/interface/models';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule, FormArray } from "@angular/forms";
import { CommonModule } from '@angular/common';
import { NgbAlertModule, NgbDatepickerModule, NgbCalendar } from '@ng-bootstrap/ng-bootstrap';
import { NgbDropdownModule, NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { NgSelectComponent as MyNgSelectComponent } from '@ng-select/ng-select';
import { FeatherIconDirective } from '../../../../core/feather-icon/feather-icon.directive';


declare var bootstrap: any;

@Component({
  selector: 'app-entree',
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
    NgbDatepickerModule,
    FeatherIconDirective
  ],
  templateUrl: 'entree.component.html'
})
export class EntreeComponent implements OnInit {

  currentDate: NgbDateStruct = inject(NgbCalendar).getToday();
  rows: MouvementStock[] = [];
  temp: MouvementStock[] = [];
  loadingIndicator = true;
  reorderable = true;
  ColumnMode = ColumnMode;

  articles: Article[] = []; // Liste des types articles
  fournisseurs: Fournisseur[] = []; // Liste des types Fournisseurs
  selectedTypeImmoId: number | null = null; // ID sélectionné

  alertAjoutVisible: boolean = false;  // Pour gérer la visibilité de l'alerte ajout
  alertModifVisible: boolean = false;  // Pour gérer la visibilité de l'alerte mofid
  alertSuppVisible: boolean = false;  // Pour gérer la visibilité de l'alerte supp

  public addEntree!: FormGroup;
  public editEntree!: FormGroup;
  public deleteEntree!: FormGroup;
  addEntreeMultipleForm: FormGroup;

  // Fichiers sélectionnés
  selectedFiles: File[] = [];

  @ViewChild('table') table!: DatatableComponent;

  constructor(private entreeService: MouvementStockService, private formBuilder: FormBuilder,) { }

  ngOnInit(): void {
    this.loadArticles();
    this.loadFournisseurs();
    this.loadEntrees();
    this.addEntree = this.formBuilder.group({
      id_Article: [null, [Validators.required]],
      id_fournisseur: [null, [Validators.required]],
      description: ["", [Validators.required]],
      qte: [1, [Validators.required]],
      date_mouvement: ["", [Validators.required]],
    });
    this.editEntree = this.formBuilder.group({
      id: [0, [Validators.required]],
      id_Article: [null, [Validators.required]],
      id_fournisseur: [null, [Validators.required]],
      description: ["", [Validators.required]],
      qte: [1, [Validators.required]],
      date_mouvement: ["", [Validators.required]],
    });
    this.deleteEntree = this.formBuilder.group({
      id: [0, [Validators.required]],
    });

    // Formulaire pour ajout multiple
    this.addEntreeMultipleForm = this.formBuilder.group({
      id_fournisseur: [null, [Validators.required]],
      numero_borderau: ["", [Validators.required]],
      date_mouvement: ["", [Validators.required]],
      piece_jointe_mouvement: [null],
      articles: this.formBuilder.array([
        this.createArticleFormGroup()
      ])
    });
  }

  // Getter pour accéder facilement au FormArray des articles
  get articlesArray(): FormArray {
    return this.addEntreeMultipleForm.get('articles') as FormArray;
  }
  // Crée un nouveau FormGroup pour un article
  createArticleFormGroup(): FormGroup {
    return this.formBuilder.group({
      id_Article: [null, [Validators.required]],
      description: ["", [Validators.required]],
      qte: [1, [Validators.required]]
    });
  }
  // Ajoute un nouvel article au FormArray
  addArticle(): void {
    this.articlesArray.push(this.createArticleFormGroup());
  }
  // Supprime un article du FormArray
  removeArticle(index: number): void {
    this.articlesArray.removeAt(index);
  }
  // Gestion de la sélection de fichiers
  onFileSelected(event: any): void {
    this.selectedFiles = Array.from(event.target.files);
  }

  // Soumission d'ajout multiple (nouvelle méthode)
  onClickSubmitAddEntreeMultiple() {
    const spinner = document.querySelector('#add_entree_multiple .spinner-border');

    if (this.addEntreeMultipleForm.valid) {
      if (spinner) spinner.classList.remove('d-none');

      // Préparer les données du formulaire
      const formData = new FormData();

      // Ajouter les données communes
      formData.append('id_fournisseur', this.addEntreeMultipleForm.value.id_fournisseur);
      formData.append('numero_borderau', this.addEntreeMultipleForm.value.numero_borderau);
      formData.append('date_mouvement', this.formatDate(this.addEntreeMultipleForm.value.date_mouvement));
            // Ajouter les articles correctement à FormData
      this.addEntreeMultipleForm.value.articles.forEach((article: any, index: number) => {
        formData.append(`articles[${index}][id_Article]`, article.id_Article);
        formData.append(`articles[${index}][description]`, article.description);
        formData.append(`articles[${index}][qte]`, article.qte);
      });

      // // Ajouter les articles (convertir en JSON)
      // formData.append('articles', JSON.stringify(this.addEntreeMultipleForm.value.articles));

      // Ajouter les fichiers si présents
      if (this.selectedFiles.length > 0) {
        this.selectedFiles.forEach((file, index) => {
          formData.append(`piece_jointe_mouvement[${index}]`, file, file.name);
        });
      }
      console.log(formData);
      // Envoyer la requête
      this.entreeService.saveMultipleMouvementStockEntree(formData).subscribe(
        (data: any) => {
          this.loadEntrees();
          if (spinner) spinner.classList.add('d-none');
          this.addEntreeMultipleForm.reset();
          this.selectedFiles = [];

          // Réinitialiser le FormArray avec un seul élément
          while (this.articlesArray.length !== 0) {
            this.articlesArray.removeAt(0);
          }
          this.addArticle();

          // Fermer le modal
          const modal = document.getElementById('add_entree_multiple');
          // @ts-ignore
          const bsModal = bootstrap.Modal.getInstance(modal);
          bsModal?.hide();

          // Afficher l'alerte de succès
          setTimeout(() => {
            this.alertAjoutVisible = true;
            setTimeout(() => {
              this.alertAjoutVisible = false;
            }, 2000);
          }, 200);
        },
        (error: any) => {
          console.error('Erreur lors de l\'ajout multiple d\'entrées :', error);
          if (spinner) spinner.classList.add('d-none');
          alert('Une erreur s\'est produite. Veuillez réessayer.');
        }
      );
    } else {
      if (spinner) spinner.classList.add('d-none');
      this.markFormGroupTouched(this.addEntreeMultipleForm);
      alert("Veuillez remplir correctement tous les champs obligatoires");
    }
  }

  // Fonction utilitaire pour marquer tous les champs comme touchés (validation)
  markFormGroupTouched(formGroup: FormGroup | FormArray) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();

      if (control instanceof FormGroup || control instanceof FormArray) {
        this.markFormGroupTouched(control);
      }
    });
  }

  onClickSubmitAddEntree() {
    console.log(this.addEntree.value);
    const spinner = document.querySelector('.spinner-border');

    if (this.addEntree.valid) {
      if (spinner) spinner.classList.remove('d-none');
      const formData = {
        ...this.addEntree.value,
        date_mouvement: this.formatDate(this.addEntree.value.date_mouvement), // Convertir la date
      };
      this.entreeService.saveMouvementStockEntree(formData).subscribe(
        (data: any) => {
          this.loadEntrees();
          if (spinner) spinner.classList.add('d-none');
          this.addEntree.reset();

          // Fermer le modal manuellement
          const modal = document.getElementById('add_entree');
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
          console.error('Erreur lors de l\'ajout de l\'entree :', error);
          if (spinner) spinner.classList.add('d-none');
          alert('Une erreur s\'est produite. Veuillez réessayer.');
        }
      );
    } else {
      if (spinner) spinner.classList.add('d-none');
      alert("Désolé, le formulaire n'est pas bien renseigné");
    }
  }

  onClickSubmitEditEntree() {
    console.log(this.editEntree.value);
    const spinner = document.querySelector('.spinnerModif');

    if (this.editEntree.valid) {
      if (spinner) spinner.classList.remove('d-none');
      const id = this.editEntree.value.id;
      const formData = {
        ...this.editEntree.value,
        date_mouvement: this.formatDate(this.editEntree.value.date_mouvement), // Convertir la date
      };
      this.entreeService.editMouvementStockEntree(formData).subscribe(
        (data: any) => {
          this.loadEntrees();
          if (spinner) spinner.classList.add('d-none');
          this.editEntree.reset();

          // Fermer le modal manuellement
          const modal = document.getElementById('edit_entree');
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
          console.error('Erreur lors de la modification de l\'entree :', error);
          if (spinner) spinner.classList.add('d-none');
          alert('Une erreur s\'est produite. Veuillez réessayer.');
        }
      );
    } else {
      if (spinner) spinner.classList.add('d-none');
      alert("Désolé, le formulaire n'est pas bien renseigné");
    }
  }

  onClickSubmitDeleteEntree() {
    console.log(this.deleteEntree.value);
    const spinner = document.querySelector('.spinnerDelete');

    if (this.deleteEntree.valid) {
      if (spinner) spinner.classList.remove('d-none');
      this.entreeService.deleteMouvementStockEntree(this.deleteEntree.value).subscribe(
        (data: any) => {
          this.loadEntrees();
          if (spinner) spinner.classList.add('d-none');
          this.deleteEntree.reset();

          // Fermer le modal manuellement
          const modal = document.getElementById('delete_entree');
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
          console.error('Erreur lors de la supression de l\'entree :', error);
          if (spinner) spinner.classList.add('d-none');
          alert('Une erreur s\'est produite. Veuillez réessayer.');
        }
      );
    } else {
      if (spinner) spinner.classList.add('d-none');
      alert("Désolé, le formulaire n'est pas bien renseigné");
    }
  }

  loadArticles(): void {
    this.entreeService.getAllArticles().subscribe({
      next: (data) => {
        this.articles = data; // Stocker la liste des articles
      },
      error: (err) => {
        console.error("Erreur lors du chargement des articles :", err);
      }
    });
  }
  loadFournisseurs(): void {
    this.entreeService.getAllFournisseurs().subscribe({
      next: (data) => {
        this.fournisseurs = data; // Stocker la liste des fournisseurs
      },
      error: (err) => {
        console.error("Erreur lors du chargement des fournisseurs :", err);
      }
    });
  }


  loadEntrees(): void {
    this.entreeService.getAllMouvementStockEntree().subscribe(
      (data: MouvementStock[]) => {
        this.temp = [...data]; // Sauvegarde de la liste complète pour la recherche
        this.rows = data;
        this.loadingIndicator = false;
      },
      error => {
        console.error('Erreur lors du chargement des Mouvements Stock Entree', error);
        this.loadingIndicator = false;
      }
    );
  }

  updateFilter(event: KeyboardEvent): void {
    const val = (event.target as HTMLInputElement).value.toLowerCase();

    this.rows = this.temp.filter(entre =>
      entre.description.toLowerCase().includes(val)
    );

    this.table.offset = 0;
  }

  getEditForm(row: any) {
    this.editEntree.patchValue({
      id: row.id,
      id_Article: row.id_Article,
      id_fournisseur: row.id_fournisseur,
      description: row.description,
      qte: row.qte,
      date_mouvement: this.convertToNgbDate(row.date_mouvement),
    })
  }

  getDeleteForm(row: any) {
    this.deleteEntree.patchValue({
      id: row.id,
    })
  }

  formatDate(date: NgbDateStruct): string {
    const year = date.year;
    const month = date.month.toString().padStart(2, '0'); // Ajoute un zéro devant si nécessaire
    const day = date.day.toString().padStart(2, '0');
    return `${year}-${month}-${day}`; // Format YYYY-MM-DD
  }


  // Méthode pour convertir "YYYY-MM-DD" en NgbDateStruct
  convertToNgbDate(dateString: string): NgbDateStruct | null {
    if (!dateString) return null;
    const parts = dateString.split('-'); // Séparer YYYY-MM-DD
    return {
      year: +parts[0],
      month: +parts[1],
      day: +parts[2],
    };
  }

}


