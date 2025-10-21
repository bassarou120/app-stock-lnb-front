import { Component, ViewChild, OnInit,ViewEncapsulation } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ColumnMode, DatatableComponent, NgxDatatableModule } from '@siemens/ngx-datatable';
import { ArticleService } from '../../../core/services/articles/articles.service';
import { Categorie, Article, ImportReport, ImportError } from '../../../core/services/interface/models';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule,FormArray  } from "@angular/forms";
import { CommonModule } from '@angular/common';
import { NgbAlertModule } from '@ng-bootstrap/ng-bootstrap';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { NgSelectComponent as MyNgSelectComponent } from '@ng-select/ng-select';
declare var bootstrap: any;
import { Router } from '@angular/router';

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
  templateUrl: 'articles.component.html',
  styleUrls: ['articles.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ArticlesComponent implements OnInit {
  // PROPRIÉTÉS POUR LA GESTION DES PERMISSIONS
  allowedFonctionnalites: string[] = [];
  canVoirParamStock: boolean = true;    // DÉFAUT À TRUE pour éviter les blocages

  hasPageAccess: boolean = true;  //  DÉFAUT À TRUE pour éviter les blocages

  rows: Article[] = [];
  temp: Article[] = [];
  loadingIndicator = true;
  reorderable = true;
  ColumnMode = ColumnMode;

importReport: ImportReport | null = null;
importError: ImportError | null = null;

  categories: Categorie[] = []; // Liste des types d'immos
  selectedCategorieId: number | null = null; // ID sélectionné

  alertAjoutVisible: boolean = false;  // Pour gérer la visibilité de l'alerte ajout
  alertModifVisible: boolean = false;  // Pour gérer la visibilité de l'alerte mofid
  alertSuppVisible: boolean = false;  // Pour gérer la visibilité de l'alerte supp
  alertImportVisible: boolean = false; // Nouvelle alerte pour l'import

  // --- NOUVELLES PROPRIÉTÉS POUR GÉRER LES CLICS MULTIPLES ---
  isAdding: boolean = false;    // Indicateur pour l'opération d'ajout
  isEditing: boolean = false;   // Indicateur pour l'opération de modification
  isDeleting: boolean = false;  // Indicateur pour l'opération de suppression
  // -----------------------------------------------------------

  public addArticle!: FormGroup ;
  public editArticle!: FormGroup ;
  public deleteArticle!: FormGroup ;
  isImporting: boolean = false; // Nouvelle propriété pour l'état d'importation
  selectedFile: File | null = null; // Pour stocker le fichier sélectionné

  public toastVisible: boolean = false;
  public toastType: 'success' | 'danger' | 'warning' = 'success'; // Type d'alerte Bootstrap
  public toastTitle: string = '';
  public toastMessage: string = '';
  public ignoredLines: string[] = []; // Pour stocker les lignes ignorées

  @ViewChild('table') table!: DatatableComponent;



  constructor(private articleService: ArticleService,private formBuilder: FormBuilder, private router: Router) {}

  ngOnInit(): void {
    // 🔥 INITIALISER LES PERMISSIONS EN PREMIER
    this.initializePermissions();

    // Ensuite charger les données seulement si on a accès
    if (this.hasPageAccess) {
    this.loadCategories();
    this.loadArticles();
    this.initForm();
    }

    this.editArticle = this.formBuilder.group({
      id: [0, [Validators.required]],
      libelle: ["", [Validators.required]],
//       code_article: ["", [Validators.required]],
      id_cat: [null, [Validators.required]],
      stock_alerte: [0, [Validators.required]],
      description: [""],
   });
    this.deleteArticle = this.formBuilder.group({
      id: [0, [Validators.required]],
   });
  }

// 🔥 NOUVELLE MÉTHODE : Initialiser les permissions
  private initializePermissions(): void {
    try {
      const allowedFonctionnalitesStr = localStorage.getItem('allowedFonctionnalites');

      if (!allowedFonctionnalitesStr) {
        console.log('⚠️ Aucune fonctionnalité trouvée - Permissions par défaut');
        return; // Garder les permissions par défaut (true)
      }

      const allowedFonctionnalites: string[] = JSON.parse(allowedFonctionnalitesStr);
      console.log('📋 Fonctionnalités autorisées:', allowedFonctionnalites);

      // 🔥 VÉRIFICATION DES PERMISSIONS SPÉCIFIQUES
      this.canVoirParamStock = allowedFonctionnalites.includes('Voir Parametres Stock');

      // 🔥 ACCÈS À LA PAGE : Si au moins une fonctionnalité de stock est autorisée
      this.hasPageAccess = this.canVoirParamStock;

      console.log('🔐 Permissions calculées:', {
        canVoirParamStock: this.canVoirParamStock,
        hasPageAccess: this.hasPageAccess
      });

      // 🔥 SI AUCUN ACCÈS, REDIRIGER VERS LE DASHBOARD
      if (!this.hasPageAccess) {
        console.warn('❌ Accès refusé parametrages de stock');
        this.router.navigate(['/error/403']);
        return;
      }

    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation des permissions:', error);
      // En cas d'erreur, garder les permissions par défaut (true)
    }
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
//       code_article: ['', [Validators.required]],
      id_cat: [null, [Validators.required]],
      description: [''],
      stock_alerte: [0, [Validators.required]]
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

  // --- MÉTHODE UTILITAIRE POUR MARQUER TOUS LES CONTRÔLES DE FORMULAIRE COMME TOUCHÉS ---
  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }
  // ---------------------------------------------------------------------

  onClickSubmitAddArticles(): void {
    // 1. Vérifier si une soumission est déjà en cours
    if (this.isAdding) {
      console.warn('Ajout d\'articles déjà en cours. Opération annulée.');
      return;
    }

    console.log(this.addArticle.value);
    // const spinner = document.querySelector('.spinner-border'); // Ce spinner sera géré par [disabled] et le texte du bouton

    // 2. Valider le formulaire
    if (this.addArticle.invalid) {
      this.markFormGroupTouched(this.addArticle); // Marque tous les champs comme touchés pour afficher les erreurs
      // if (spinner) spinner.classList.add('d-none'); // Géré par isAdding
      alert("Désolé, le formulaire n'est pas bien renseigné");
      return;
    }

    // 3. Activer l'indicateur de chargement
    this.isAdding = true;
    // if (spinner) spinner.classList.remove('d-none'); // Géré par isAdding

    // Convertir le FormArray en un tableau d'articles à envoyer
    const articlesToSave = this.articlesArray.value;

    // Créer un observable pour sauvegarder tous les articles
    this.articleService.saveMultipleArticles(articlesToSave).subscribe({
      next: (data: any) => {
        this.loadArticles();
        // if (spinner) spinner.classList.add('d-none'); // Géré par complete
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
      error: (error: any) => {
        console.error('Erreur lors de l\'ajout des Articles :', error);
        // if (spinner) spinner.classList.add('d-none'); // Géré par complete
        alert('Une erreur s\'est produite. vérifiez si ce code n\'existe pas déjà. Veuillez réessayer.');
      },
      complete: () => {
        // 4. Désactiver l'indicateur de chargement dans le bloc 'complete' du subscribe
        this.isAdding = false;
      }
    });
  }


//   onClickSubmitAddArticle() {
//   console.log(this.addArticle.value);
//   const spinner = document.querySelector('.spinner-border');

//   if (this.addArticle.valid) {
//     if (spinner) spinner.classList.remove('d-none');
//     this.articleService.saveArticle(this.addArticle.value).subscribe(
//       (data: any) => {
//         this.loadArticles();
//         if (spinner) spinner.classList.add('d-none');
//         this.addArticle.reset();

//         // Fermer le modal manuellement
//         const modal = document.getElementById('add_article');
//         // @ts-ignore - pour éviter les erreurs TypeScript
//         const bsModal = bootstrap.Modal.getInstance(modal);
//         bsModal?.hide();

//         // Attendre que le modal soit fermé avant d'afficher l'alerte
//         setTimeout(() => {
//           this.alertAjoutVisible = true;
//           console.log('Alert visible après fermeture du modal:', this.alertAjoutVisible);

//           // Utilisation de la transition pour faire apparaitre l'alerte
//           setTimeout(() => {
//             this.alertAjoutVisible = false;
//           }, 2000); // L'alerte disparaît après 2 secondes
//         }, 200); // L'alerte apparaît 200ms après la fermeture du modal
//       },
//       (error: any) => {
//         console.error('Erreur lors de l\'ajout de l\'Article :', error);
//         if (spinner) spinner.classList.add('d-none');
//         alert('Une erreur s\'est produite. Veuillez réessayer.');
//       }
//     );
//   } else {
//     if (spinner) spinner.classList.add('d-none');
//     alert("Désolé, le formulaire n'est pas bien renseigné");
//   }
// }

  onClickSubmitEditArticle(){
    // 1. Vérifier si une soumission est déjà en cours
    if (this.isEditing) {
      console.warn('Modification d\'article déjà en cours. Opération annulée.');
      return;
    }

    console.log(this.editArticle.value);
    // const spinner = document.querySelector('.spinnerModif'); // Ce spinner sera géré par [disabled] et le texte du bouton

    // 2. Valider le formulaire
    if (this.editArticle.invalid) {
      this.markFormGroupTouched(this.editArticle);
      // if (spinner) spinner.classList.add('d-none'); // Géré par isEditing
      alert("Désolé, le formulaire n'est pas bien renseigné");
      return;
    }

    // 3. Activer l'indicateur de chargement
    this.isEditing = true;
    // if (spinner) spinner.classList.remove('d-none'); // Géré par isEditing

    const id = this.editArticle.value.id;
    this.articleService.editArticle(this.editArticle.value).subscribe({
      next: (data: any) => {
        this.loadArticles();
        // if (spinner) spinner.classList.add('d-none'); // Géré par complete
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
      error: (error: any) => {
        console.error('Erreur lors de la modification de l\'Article :', error);
        // if (spinner) spinner.classList.add('d-none'); // Géré par complete
        alert('Une erreur s\'est produite. Veuillez réessayer.');
      },
      complete: () => {
        // 4. Désactiver l'indicateur de chargement dans le bloc 'complete' du subscribe
        this.isEditing = false;
      }
    });
  }

  onClickSubmitDeleteArticle(){
    // 1. Vérifier si une soumission est déjà en cours
    if (this.isDeleting) {
      console.warn('Suppression d\'article déjà en cours. Opération annulée.');
      return;
    }

    console.log(this.deleteArticle.value);
    // const spinner = document.querySelector('.spinnerDelete'); // Ce spinner sera géré par [disabled] et le texte du bouton

    // 2. Valider le formulaire
    if (this.deleteArticle.invalid) {
      this.markFormGroupTouched(this.deleteArticle);
      alert("Désolé, le formulaire n'est pas bien renseigné");
      return;
    }

    // 3. Activer l'indicateur de chargement
    this.isDeleting = true;
    // if (spinner) spinner.classList.remove('d-none'); // Géré par isDeleting

    this.articleService.deleteArticle(this.deleteArticle.value).subscribe({
      next: (data: any) => {
        this.loadArticles();
        // if (spinner) spinner.classList.add('d-none'); // Géré par complete
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
      error: (error: any) => {
        console.error('Erreur lors de la supression de l\'Article :', error);
        // if (spinner) spinner.classList.add('d-none'); // Géré par complete
        alert('Une erreur s\'est produite. Veuillez réessayer.');
      },
      complete: () => {
        // 4. Désactiver l'indicateur de chargement dans le bloc 'complete' du subscribe
        this.isDeleting = false;
      }
    });
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
    (article.code_article && article.code_article.toLowerCase().includes(val)) ||
    (article.libelle && article.libelle.toLowerCase().includes(val)) ||
    (article.cat && article.cat.libelle_categorie_article && article.cat.libelle_categorie_article.toLowerCase().includes(val)) ||
    (article.description && String(article.description).toLowerCase().includes(val)) ||
    (article.seuil_alerte && String(article.seuil_alerte).toLowerCase().includes(val))
  );
  this.table.offset = 0;
}

  getEditForm(row: any){
    this.editArticle.patchValue({
     id:row.id,
     id_cat:row.id_cat,
     libelle:row.libelle,
     code_article:row.code_article,
     stock_alerte:row.stock_alerte,
     description:row.description,
    })
  }

  getDeleteForm(row: any){
    this.deleteArticle.patchValue({
     id:row.id,
    })
  }

/**
   * Gère la sélection du fichier Excel par l'utilisateur.
   * @param event L'événement de changement du champ input de type 'file'.
   */
  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      console.log('Fichier sélectionné:', this.selectedFile.name);
    } else {
      this.selectedFile = null;
    }
  }

  /**
   * Envoie le fichier Excel sélectionné au backend pour importation.
   */
    uploadExcelFile(): void {
    // ⚠️ On retire la fonction locale showNotification ⚠️

    if (!this.selectedFile) {
        // Utilisation du Toast pour l'alerte
        this.showToast('warning', 'Sélection de Fichier', 'Veuillez sélectionner un fichier Excel à importer.');
        return;
    }

    this.isImporting = true;
    this.importReport = null;
    this.importError = null;

    const spinner = document.querySelector('.spinner-import-article');
    if (spinner) {
        spinner.classList.remove('d-none');
    }

    const formData = new FormData();
    formData.append('file', this.selectedFile, this.selectedFile.name);

    this.articleService.importArticles(formData).subscribe({
        next: (response: any) => {
            console.log('Importation réussie:', response);
            this.loadArticles();

            this.isImporting = false;
            if (spinner) {
                spinner.classList.add('d-none');
            }

            // Fermer le modal d'importation
            const modal = document.getElementById('importArticlesExcel');
            if (typeof bootstrap !== 'undefined' && modal) {
                const bsModal = bootstrap.Modal.getInstance(modal);
                bsModal?.hide();
            }

            // Stocker le rapport (optionnel, mais bien pour le debug)
            this.importReport = {
                message: response.message,
                success_count: response.success_count,
                total_rows_processed: response.total_rows_processed,
                ignored: response.ignored || []
            };

            // ✅ GESTION DU SUCCÈS OU SUCCÈS PARTIEL avec this.showToast()
            if (this.importReport.ignored.length > 0) {
                this.ignoredLines = this.importReport.ignored; // Stocke les lignes pour l'affichage HTML du toast
                this.showToast(
                    'warning', // Type : Avertissement (jaune/orange)
                    'Importation Partielle',
                    response.message + '. Veuillez consulter les lignes ignorées.'
                );
            } else {
                this.ignoredLines = []; // Aucune ligne ignorée
                this.showToast(
                    'success', // Type : Succès (vert)
                    'Importation Réussie !',
                    response.message || 'Tous les articles ont été importés avec succès.'
                );
            }

            this.selectedFile = null;
        },
        error: (error) => {
            console.error('Erreur lors de l\'importation des articles:', error);

            this.isImporting = false;
            if (spinner) {
                spinner.classList.add('d-none');
            }

            // GESTION DE L'ERREUR avec this.showToast()
            let errorMessage = 'Une erreur est survenue lors de l\'importation. Veuillez vérifier le fichier et réessayer.';
            let errorTitle = 'Erreur Générale';

            if (error.error) {
                if (error.error.errors) {
                    // Erreur de validation (422)
                    let validationErrors = [];
                    for (const key in error.error.errors) {
                        if (error.error.errors.hasOwnProperty(key)) {
                            validationErrors.push(error.error.errors[key].join(', '));
                        }
                    }
                    errorMessage = 'Le fichier contient des erreurs de validation : ' + validationErrors.join('; ');
                    errorTitle = 'Erreur de Validation (422)';
                } else if (error.error.message) {
                    // Erreur critique (500)
                    errorMessage = error.error.message + (error.error.error ? ` Détails: ${error.error.error}` : '');
                    errorTitle = 'Erreur Critique du Serveur';
                }
            }

            // Utilisation du Toast pour l'erreur
            this.ignoredLines = []; // Pas de lignes ignorées à afficher en cas d'erreur totale
            this.showToast('danger', errorTitle, errorMessage);
        }
    });
}

  showToast(type: 'success' | 'danger' | 'warning', title: string, message: string): void {
    this.toastType = type;
    this.toastTitle = title;
    this.toastMessage = message;
    this.toastVisible = true;

    // Masquer le toast automatiquement après 5 secondes
    setTimeout(() => {
      this.toastVisible = false;
      this.ignoredLines = [];
    }, 60000);
  }



 }
