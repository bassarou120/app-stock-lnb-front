import { Component, ViewChild, OnInit, inject,ViewEncapsulation  } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ColumnMode, DatatableComponent, NgxDatatableModule } from '@siemens/ngx-datatable';
import { MouvementStockService } from '../../../../core/services/mouvementstock/entree.service';
import { MouvementStock, Article, Fournisseur, UniteDeMesure } from '../../../../core/services/interface/models';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule, FormArray } from "@angular/forms";
import { CommonModule } from '@angular/common';
import { NgbAlertModule, NgbDatepickerModule, NgbCalendar } from '@ng-bootstrap/ng-bootstrap';
import { NgbDropdownModule, NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { NgSelectComponent as MyNgSelectComponent } from '@ng-select/ng-select';
import { FeatherIconDirective } from '../../../../core/feather-icon/feather-icon.directive';
import { environment } from "../../../../../environments/environment";
import { Router } from '@angular/router';

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
  templateUrl: 'entree.component.html',
  styleUrls: ['entree.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class EntreeComponent implements OnInit {
  @ViewChild('fileInputMultiple') fileInputMultiple!: any;


  // 🔥 PROPRIÉTÉS POUR LA GESTION DES PERMISSIONS
  allowedFonctionnalites: string[] = [];
  canViewEntries: boolean = true; // 🔥 DÉFAUT À TRUE pour éviter les blocages
  canAddStock: boolean = true;    // 🔥 DÉFAUT À TRUE pour éviter les blocages
  canAddStockMultiple: boolean = true;     // Pour "Ajout du Stock" (bouton multiple)
  canModifyStock: boolean = true; // 🔥 DÉFAUT À TRUE pour éviter les blocages
  canDeleteStock: boolean = true; // 🔥 DÉFAUT À TRUE pour éviter les blocages
  canExportStock: boolean = true; // 🔥 DÉFAUT À TRUE pour éviter les blocages
  hasPageAccess: boolean = true;  // 🔥 DÉFAUT À TRUE pour éviter les blocages

  currentDate: NgbDateStruct = inject(NgbCalendar).getToday();
  rows: MouvementStock[] = [];
  temp: MouvementStock[] = [];
  loadingIndicator = true;
  reorderable = true;
  ColumnMode = ColumnMode;

  articles: Article[] = [];
  uniteDeMesures: UniteDeMesure[] = [];
  fournisseurs: Fournisseur[] = [];
  selectedTypeImmoId: number | null = null;

  alertAjoutVisible: boolean = false;
  alertModifVisible: boolean = false;
  alertSuppVisible: boolean = false;

  public addEntree!: FormGroup;
  public editEntree!: FormGroup;
  public deleteEntree!: FormGroup;
  public addEntreeMultipleForm: FormGroup;
  public selectedEntree: any = null;

  public url: string = environment.base_url_backend;

  mouvements: MouvementStock[] = [];
  loading: boolean = false;
  errorMessage: string = '';

  isAddingSingleEntree: boolean = false;
  isAddingMultipleEntrees: boolean = false;

  selectedFiles: File[] = [];
  selectedFile: File | null = null;

  @ViewChild('table') table!: DatatableComponent;

  constructor(private entreeService: MouvementStockService, private formBuilder: FormBuilder, private router: Router) { }

  ngOnInit(): void {
    console.log('🔄 EntreeComponent ngOnInit démarré');

    // 🔥 INITIALISER LES PERMISSIONS EN PREMIER
    this.initializePermissions();

    // Ensuite charger les données seulement si on a accès
    if (this.hasPageAccess) {
      this.loadArticles();
      this.loadFournisseurs();
      this.loadEntrees();
      this.loadUniteDeMesures();
      this.initializeForms();
    }

    console.log('✅ EntreeComponent ngOnInit terminé');
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
      this.canAddStock = allowedFonctionnalites.includes('Ajout du Stock');
      this.canAddStockMultiple = allowedFonctionnalites.includes('Ajout du Stock');
      this.canModifyStock = allowedFonctionnalites.includes('Modification du Stock');
      this.canDeleteStock = allowedFonctionnalites.includes('Suppression du Stock');
      this.canExportStock = allowedFonctionnalites.includes('Export Stock');
      this.canViewEntries = allowedFonctionnalites.includes('Voir les entrées') ;

      // 🔥 ACCÈS À LA PAGE : Si au moins une fonctionnalité de stock est autorisée
      this.hasPageAccess = this.canViewEntries;

      console.log('🔐 Permissions calculées:', {
        canAddStock: this.canAddStock,
        canAddStockMultiple: this.canAddStockMultiple,
        canModifyStock: this.canModifyStock,
        canDeleteStock: this.canDeleteStock,
        canExportStock: this.canExportStock,
        hasPageAccess: this.hasPageAccess
      });

      // 🔥 REDIRECTION VERS PAGE D'ERREUR 403 SI PAS DACCES
      if (!this.hasPageAccess) {
        console.warn('❌ Accès refusé à la page des entrées de stock');
        this.router.navigate(['/error/403']);
        return;
      }

    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation des permissions:', error);
      // En cas d'erreur, garder les permissions par défaut (true)
    }
  }

  // 🔥 NOUVELLE MÉTHODE : Définir les permissions par défaut
  private setDefaultPermissions(): void {
    this.canViewEntries = true;
    this.canAddStock = true;
    this.canModifyStock = true;
    this.canDeleteStock = true;
    this.canExportStock = true;
    this.hasPageAccess = true;
    console.log('✅ Permissions par défaut appliquées');
  }

  // 🔥 NOUVELLE MÉTHODE : Vérifier une permission
  private checkPermission(requiredPermissions: string[]): boolean {
    return requiredPermissions.some(permission =>
      this.allowedFonctionnalites.includes(permission)
    );
  }

  // Créer une méthode séparée pour "Voir plus"
  getViewForm(row: any): void {
    this.selectedEntree = row; // Stocker la ligne sélectionnée
  }

  // 🔥 NOUVELLE MÉTHODE : Initialiser les formulaires (séparée pour plus de clarté)
  private initializeForms(): void {
    this.addEntree = this.formBuilder.group({
      id_Article: [null, [Validators.required]],
      id_fournisseur: [null, [Validators.required]],
      id_unite_de_mesure: [null, [Validators.required]],
      description: ["", []],
      qte: [1, [Validators.required]],
      prixUnitaire: [100, [Validators.required]],
      date_mouvement: ["", [Validators.required]],
      piece_jointe_mouvement: [null] // 🔥 AJOUT DU CHAMP MANQUANT
    });

    this.editEntree = this.formBuilder.group({
      id: [0, [Validators.required]],
      id_Article: [null, [Validators.required]],
      id_fournisseur: [null, [Validators.required]],
      id_unite_de_mesure: [null, [Validators.required]],
      description: ["", []],
      qte: [1, [Validators.required]],
      prixUnitaire: [100, [Validators.required]],
      date_mouvement: ["", [Validators.required]],
      // 🔥 PAS DE piece_jointe_mouvement pour l'édition (généralement on ne modifie pas les fichiers)
    });

    this.deleteEntree = this.formBuilder.group({
      id: [0, [Validators.required]],
    });

    // Formulaire pour ajout multiple
    this.addEntreeMultipleForm = this.formBuilder.group({
      id_fournisseur: [null, [Validators.required]],
      numero_borderau: ["", [Validators.required]],
      date_mouvement: ["", [Validators.required]],
      piece_jointe_mouvement: [null], // 🔥 CHAMP DÉJÀ PRÉSENT
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
      id_unite_de_mesure: [null, [Validators.required]],
      description: ["", []],
      qte: [1, [Validators.required]],
      prixUnitaire: [100, [Validators.required]]
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
    if (event.target.files && event.target.files.length > 0) {
      this.selectedFiles = Array.from(event.target.files);
      console.log('Fichiers sélectionnés (multiple):', this.selectedFiles.length);
    }
  }

/*   onFileSelectedOnefile(event: any) {
    if (event.target.files && event.target.files.length > 0) {
      this.selectedFile = event.target.files[0];
      console.log('Fichier sélectionné (simple):', this.selectedFile.name);
    }
  } */

    onFileSelectedOnefile(event: any) {
    this.selectedFile = event.target.files[0];
  }

  // Soumission d'ajout multiple
onClickSubmitAddEntreeMultiple() {

  // 🔥 VÉRIFICATION DE PERMISSION AVANT SOUMISSION
  if (!this.canAddStock || !this.canAddStockMultiple) {
    alert('Vous n\'avez pas l\'autorisation d\'ajouter du stock.');
    return;
  }

  if (this.isAddingMultipleEntrees) {
    console.warn('Soumission multiple détectée pour Entrée Multiple. Annulation.');
    return;
  }

  const spinner = document.querySelector('.spinner-multiple-add');

  if (this.addEntreeMultipleForm.valid) {

    this.isAddingMultipleEntrees = true;
    if (spinner) spinner.classList.remove('d-none');

    // Préparer les données du formulaire
    const formData = new FormData();

    // Données communes
    formData.append('id_fournisseur', this.addEntreeMultipleForm.value.id_fournisseur);
    formData.append('numero_borderau', this.addEntreeMultipleForm.value.numero_borderau);
    formData.append('date_mouvement', this.formatDate(this.addEntreeMultipleForm.value.date_mouvement));

    // Articles
    this.addEntreeMultipleForm.value.articles.forEach((article: any, index: number) => {
      formData.append(`articles[${index}][id_Article]`, article.id_Article);
      formData.append(`articles[${index}][id_unite_de_mesure]`, article.id_unite_de_mesure);
      formData.append(`articles[${index}][description]`, article.description);
      formData.append(`articles[${index}][qte]`, article.qte);
      formData.append(`articles[${index}][prixUnitaire]`, article.prixUnitaire);
    });

    // Fichiers
    if (this.selectedFiles.length > 0) {
      this.selectedFiles.forEach((file: any, index: number) => {
        formData.append(`piece_jointe_mouvement[${index}]`, file, file.name);
      });
    }

    // Envoi
    this.entreeService.saveMultipleMouvementStockEntree(formData).subscribe(
      (data: any) => {

        this.loadEntrees();

        if (spinner) spinner.classList.add('d-none');

        // Réinitialisation du formulaire
        this.addEntreeMultipleForm.reset();
        this.selectedFiles = [];

        // Retirer tous les articles sauf un
        while (this.articlesArray.length !== 0) {
          this.articlesArray.removeAt(0);
        }
        this.addArticle();

        this.isAddingMultipleEntrees = false;

        // 🔥 CORRECTION IMPORTANTE : vider réellement l’input file
        if (this.fileInputMultiple && this.fileInputMultiple.nativeElement) {
          this.fileInputMultiple.nativeElement.value = "";
        }

        // Fermeture du modal
        const modal = document.getElementById('add_entree_multiple');
        // @ts-ignore
        const bsModal = bootstrap.Modal.getInstance(modal);
        bsModal?.hide();

        // Alerte succès
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
                this.isAddingMultipleEntrees = false;
        
                // --- Logique d'affichage du message améliorée ---
                let detail = 'Veuillez vérifier votre connexion et les données du formulaire, puis réessayer.';
        
                if (error.status === 422) {
                  // Erreur de validation (données manquantes ou incorrectes)
                  detail = 'Certaines informations de votre formulaire sont manquantes ou incorrectes. Veuillez vérifier tous les champs (codes articles, quantités, prix).';
                } else if (error.status === 401 || error.status === 403) {
                  // Erreur d'autorisation
                  detail = 'Vous n\'êtes pas autorisé à effectuer cette opération. Veuillez vérifier vos permissions.';
                } else if (error.status === 0) {
                  // Erreur de réseau ou serveur injoignable
                  detail = 'Impossible de se connecter au serveur. Vérifiez votre connexion Internet.';
                } else if (error.error && error.error.message) {
                  // Afficher le message d'erreur du serveur s'il est disponible
                  detail = `Erreur Serveur: ${error.error.message}`;
                }
        
                // Message final clair
                alert(`L'ajout multiple d'entrées a échoué.\n\nDétails.`);
              }
            );

  } else {
    if (spinner) spinner.classList.add('d-none');
    this.markFormGroupTouched(this.addEntreeMultipleForm);
    alert("Veuillez remplir correctement tous les champs obligatoires");
  }
}


  // Soumission d'ajout simple
  onClickSubmitAddEntree() {
    if (!this.canAddStock) {
      alert('Vous n\'avez pas l\'autorisation d\'ajouter du stock.');
      return;
    }

    if (this.isAddingSingleEntree) {
        console.warn('Soumission multiple détectée pour Entrée Simple. Annulation.');
        return; // Empêche l'exécution si déjà en cours
    }

    console.log(this.addEntree.value);
    const spinner = document.querySelector('.spinner-single-add');

    if (this.addEntree.valid) {
      this.isAddingSingleEntree = true; // Désactiver le bouton d'ajout simple
      if (spinner) spinner.classList.remove('d-none');
      console.log('isAddingSingleEntree mis à true.'); // Log pour le débogage

      const formData = new FormData();

      formData.append('id_Article', this.addEntree.value.id_Article);
      formData.append('id_fournisseur', this.addEntree.value.id_fournisseur);
      formData.append('id_unite_de_mesure', this.addEntree.value.id_unite_de_mesure);
      formData.append('description', this.addEntree.value.description || '');
      formData.append('qte', this.addEntree.value.qte);
      formData.append('prixUnitaire', this.addEntree.value.prixUnitaire);
      formData.append('date_mouvement', this.formatDate(this.addEntree.value.date_mouvement));

      // Ajout du fichier si présent
      if (this.selectedFile) {
        formData.append('piece_jointe_mouvement', this.selectedFile);
      }

      this.entreeService.saveMouvementStockEntree(formData).subscribe(
        (data: any) => {
          this.loadEntrees();
          if (spinner) spinner.classList.add('d-none');
          this.addEntree.reset();
          this.selectedFile = null;
          this.isAddingSingleEntree = false; // Réactiver le bouton
          console.log('Soumission Entrée Simple réussie. isAddingSingleEntree mis à false.'); // Log pour le débogage


          const modal = document.getElementById('add_entree');
          // @ts-ignore
          const bsModal = bootstrap.Modal.getInstance(modal);
          bsModal?.hide();

          setTimeout(() => {
            this.alertAjoutVisible = true;
            setTimeout(() => {
              this.alertAjoutVisible = false;
            }, 2000);
          }, 200);
        },
        (error: any) => {
                    console.error('Erreur lors de l\'ajout de l\'entrée :', error);
                    if (spinner) spinner.classList.add('d-none');
                    this.isAddingSingleEntree = false; // Réactiver le bouton en cas d'erreur
                    console.error('Soumission Entrée Simple échouée. isAddingSingleEntree mis à false.'); // Log pour le débogage
          
                    // --- Logique d'affichage du message améliorée ---
                    let detail = 'Veuillez vérifier vos données et réessayer.';
          
                    if (error.status === 422) {
                      // Erreur de validation (données manquantes ou incorrectes)
                      detail = 'Certaines informations sont manquantes ou incorrectes. Veuillez vérifier tous les champs du formulaire d\'entrée.';
                    } else if (error.status === 401 || error.status === 403) {
                      // Erreur d'autorisation
                      detail = 'Accès refusé. Vous n\'avez pas les permissions pour enregistrer une entrée.';
                    } else if (error.status === 0) {
                      // Erreur de réseau ou serveur injoignable
                      detail = 'Erreur de connexion. Le serveur est injoignable. Vérifiez votre connexion Internet.';
                    } else if (error.error && error.error.message) {
                      // Afficher le message d'erreur du serveur s'il est disponible
                      detail = `Erreur Serveur: ${error.error.message}`;
                    }
          
                    // Message final clair
                    alert(`L'enregistrement de l'entrée de stock a échoué.\n\nDétails : ${detail}\n\nSi le problème persiste, veuillez contacter le support technique.`);
                  }
                );
    } else {
      if (spinner) spinner.classList.add('d-none');
      alert("Désolé, le formulaire n'est pas bien renseigné");
      console.log('Formulaire Entrée Simple invalide.'); // Log pour le débogage
    }

  }

  onClickSubmitEditEntree() {
    // 🔥 VÉRIFICATION DE PERMISSION AVANT SOUMISSION
    if (!this.canModifyStock) {
        if (this.isAddingMultipleEntrees) {
        console.warn('Soumission multiple détectée pour Entrée Multiple. Annulation.');
        return; // Empêche l'exécution si déjà en cours
    }

    const spinner = document.querySelector('.spinner-multiple-add');

    if (this.addEntreeMultipleForm.valid) {
      this.isAddingMultipleEntrees = true; // Désactiver le bouton d'ajout multiple
      if (spinner) spinner.classList.remove('d-none');
      console.log('isAddingMultipleEntrees mis à true.'); // Log pour le débogage


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
          this.isAddingMultipleEntrees = false; // Réactiver le bouton
          console.log('Soumission Entrée Multiple réussie. isAddingMultipleEntrees mis à false.'); // Log pour le débogage


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
                    this.isAddingMultipleEntrees = false; // Réactiver le bouton en cas d'erreur
                    console.error('Soumission Entrée Multiple échouée. isAddingMultipleEntrees mis à false.'); // Log pour le débogage
          
                    // --- Logique d'affichage du message améliorée ---
                    let detail = 'Veuillez vérifier vos données et réessayer.';
          
                    if (error.status === 422) {
                      // Erreur de validation (données manquantes ou incorrectes)
                      detail = 'Erreur de validation : Un ou plusieurs articles n\'ont pas été correctement remplis. Veuillez vérifier les codes, les quantités et les prix de **toutes les lignes** d\'entrée.';
                    } else if (error.status === 401 || error.status === 403) {
                      // Erreur d'autorisation
                      detail = 'Accès refusé. Vous n\'avez pas les permissions pour effectuer un ajout multiple d\'entrées.';
                    } else if (error.status === 0) {
                      // Erreur de réseau ou serveur injoignable
                      detail = 'Erreur de connexion : Le serveur est injoignable. Veuillez vérifier votre connexion Internet.';
                    } else if (error.error && error.error.message) {
                      // Afficher le message d'erreur du serveur s'il est disponible
                      detail = `Erreur Serveur: ${error.error.message}`;
                    }
          
                    // Message final clair
                    alert(`L'enregistrement des entrées multiples a échoué.\n\nDétails : ${detail}\n\nSi le problème persiste, veuillez contacter le support technique.`);
                  }
                );
    } else {
      if (spinner) spinner.classList.add('d-none');
      this.markFormGroupTouched(this.addEntreeMultipleForm);
      alert("Veuillez remplir correctement tous les champs obligatoires");
      console.log('Formulaire Entrée Multiple invalide.'); // Log pour le débogage
    }  alert('Vous n\'avez pas l\'autorisation de modifier le stock.');
      return;
    }

    console.log(this.editEntree.value);
    const spinner = document.querySelector('.spinnerModif');

    if (this.editEntree.valid) {
      if (spinner) spinner.classList.remove('d-none');
      const formData = {
        ...this.editEntree.value,
        date_mouvement: this.formatDate(this.editEntree.value.date_mouvement),
      };

      this.entreeService.editMouvementStockEntree(formData).subscribe(
        (data: any) => {
          this.loadEntrees();
          if (spinner) spinner.classList.add('d-none');
          this.editEntree.reset();

          const modal = document.getElementById('edit_entree');
          // @ts-ignore
          const bsModal = bootstrap.Modal.getInstance(modal);
          bsModal?.hide();

          setTimeout(() => {
            this.alertModifVisible = true;
            setTimeout(() => {
              this.alertModifVisible = false;
            }, 2000);
          }, 200);
        },
        (error: any) => {
                    console.error('Erreur lors de la modification de l\'entree :', error);
                    if (spinner) spinner.classList.add('d-none');
                    
                    // --- Logique d'affichage du message améliorée ---
                    let detail = 'Veuillez vérifier vos données et réessayer.';
          
                    if (error.status === 422) {
                      // Erreur de validation (données manquantes ou incorrectes)
                      detail = 'Erreur de validation : Certaines informations sont manquantes ou incorrectes. Veuillez vérifier tous les champs du formulaire de modification.';
                    } else if (error.status === 404) {
                      // Erreur 404 si l'entrée à modifier n'est plus trouvée
                      detail = 'L\'entrée de stock que vous tentez de modifier est introuvable ou a été supprimée par un autre utilisateur. Rechargez la page.';
                    } else if (error.status === 401 || error.status === 403) {
                      // Erreur d'autorisation
                      detail = 'Accès refusé. Vous n\'avez pas les permissions pour modifier cette entrée.';
                    } else if (error.status === 0) {
                      // Erreur de réseau ou serveur injoignable
                      detail = 'Erreur de connexion : Le serveur est injoignable. Veuillez vérifier votre connexion Internet.';
                    } else if (error.error && error.error.message) {
                      // Afficher le message d'erreur du serveur s'il est disponible
                      detail = `Erreur Serveur: ${error.error.message}`;
                    }
          
                    // Message final clair
                    alert(`La modification de l'entrée de stock a échoué.\n\nDétails : ${detail}\n\nSi le problème persiste, veuillez contacter le support technique.`);
                  }
                );
    } else {
      if (spinner) spinner.classList.add('d-none');
      alert("Désolé, le formulaire n'est pas bien renseigné");
    }
  }

  onClickSubmitDeleteEntree() {
    // 🔥 VÉRIFICATION DE PERMISSION AVANT SOUMISSION
    if (!this.canDeleteStock) {
      alert('Vous n\'avez pas l\'autorisation de supprimer du stock.');
      return;
    }

    console.log(this.deleteEntree.value);
    const spinner = document.querySelector('.spinnerDelete');

    if (this.deleteEntree.valid) {
      if (spinner) spinner.classList.remove('d-none');
      this.entreeService.deleteMouvementStockEntree(this.deleteEntree.value).subscribe(
        (data: any) => {
          this.loadEntrees();
          if (spinner) spinner.classList.add('d-none');
          this.deleteEntree.reset();

          const modal = document.getElementById('delete_entree');
          // @ts-ignore
          const bsModal = bootstrap.Modal.getInstance(modal);
          bsModal?.hide();

          setTimeout(() => {
            this.alertSuppVisible = true;
            setTimeout(() => {
              this.alertSuppVisible = false;
            }, 2000);
          }, 200);
        },
        (error: any) => {
                    console.error('Erreur lors de la suppression de l\'entree :', error);
                    if (spinner) spinner.classList.add('d-none');
                    
                    // --- Logique d'affichage du message améliorée ---
                    let detail = 'Veuillez réessayer l\'opération. Si l\'erreur persiste, contactez le support.';
          
                    if (error.status === 404) {
                      // Erreur 404 si l'entrée à supprimer n'est plus trouvée
                      detail = 'L\'entrée de stock sélectionnée est introuvable. Elle a peut-être déjà été supprimée ou le système a un décalage. Rechargez la page.';
                    } else if (error.status === 401 || error.status === 403) {
                      // Erreur d'autorisation
                      detail = 'Accès refusé. Vous n\'avez pas les permissions nécessaires pour supprimer cette entrée.';
                    } else if (error.status === 400 || error.status === 500) {
                      // Erreur possible si l'entrée a des dépendances (ex: déjà utilisée dans des sorties)
                      detail = 'Impossible de supprimer cette entrée. Elle est peut-être déjà liée à des mouvements de stock (sorties) et ne peut être retirée.';
                      // Tenter d'afficher le message du serveur s'il est plus précis
                      if (error.error && error.error.message) {
                        detail = `Erreur Serveur: ${error.error.message}.`;
                      }
                    } else if (error.status === 0) {
                      // Erreur de réseau
                      detail = 'Erreur de connexion : Le serveur est injoignable. Veuillez vérifier votre connexion Internet.';
                    }
          
                    // Message final clair
                    alert(`La suppression de l'entrée de stock a échoué.\n\nDétails : ${detail}\n\nEn cas d'échec répété, veuillez contacter le support technique.`);
                  }
                );
    } else {
      if (spinner) spinner.classList.add('d-none');
      alert("Désolé, le formulaire n'est pas bien renseigné");
    }
  }

  // Fonction utilitaire pour marquer tous les champs comme touchés
  markFormGroupTouched(formGroup: FormGroup | FormArray) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();

      if (control instanceof FormGroup || control instanceof FormArray) {
        this.markFormGroupTouched(control);
      }
    });
  }

  loadArticles(): void {
    this.entreeService.getAllArticles().subscribe({
      next: (data) => {
        this.articles = data;
      },
      error: (err) => {
        console.error("Erreur lors du chargement des articles :", err);
      }
    });
  }

  loadFournisseurs(): void {
    this.entreeService.getAllFournisseurs().subscribe({
      next: (data) => {
        this.fournisseurs = data;
      },
      error: (err) => {
        console.error("Erreur lors du chargement des fournisseurs :", err);
      }
    });
  }

  loadUniteDeMesures(): void {
    this.entreeService.getAllUniteDeMesure().subscribe({
      next: (data) => {
        this.uniteDeMesures = data;
      },
      error: (err) => {
        console.error("Erreur lors du chargement des uniteDeMesures :", err);
      } 
    });
  }

  loadEntrees(): void {
    this.entreeService.getAllMouvementStockEntree().subscribe(
      (data: MouvementStock[]) => {
        this.temp = [...data];
        this.rows = data;
        this.loadingIndicator = false;
      },
      error => {
        console.error('Erreur lors du chargement des Mouvements Stock Entree', error);
        this.loadingIndicator = false;
      }
    );
  }

  // updateFilter(event: KeyboardEvent): void {
  //   const val = (event.target as HTMLInputElement).value.toLowerCase();

  //   this.rows = this.temp.filter(entre =>
  //     entre.description.toLowerCase().includes(val)
  //   );

  //   this.table.offset = 0;
  // }
  updateFilter(event: KeyboardEvent): void {
    const val = (event.target as HTMLInputElement).value.toLowerCase();

    this.rows = this.temp.filter(stockItem =>
      (stockItem.article && stockItem.article.code_article && stockItem.article.code_article.toLowerCase().includes(val)) ||
      (stockItem.article && stockItem.article.libelle && stockItem.article.libelle.toLowerCase().includes(val)) ||
      (stockItem.description && stockItem.description.toLowerCase().includes(val)) ||
      (stockItem.qte && String(stockItem.qte).toLowerCase().includes(val)) ||
      (stockItem.unite_de_mesure && stockItem.unite_de_mesure && String(stockItem.unite_de_mesure).toLowerCase().includes(val)) ||
      (stockItem.fournisseur && stockItem.fournisseur.nom && stockItem.fournisseur.nom.toLowerCase().includes(val))
    );
    this.table.offset = 0;
  }

  getEditForm(row: any) {
    this.editEntree.patchValue({
      id: row.id,
      id_Article: row.id_Article,
      id_fournisseur: row.id_fournisseur,
      id_unite_de_mesure: row.id_unite_de_mesure,
      description: row.description,
      qte: row.qte,
      prixUnitaire: row.prixUnitaire,
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
    const month = date.month.toString().padStart(2, '0');
    const day = date.day.toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Méthode pour convertir "YYYY-MM-DD" en NgbDateStruct
  convertToNgbDate(dateString: string): NgbDateStruct | null {
    if (!dateString) return null;
    const parts = dateString.split('-');
    return {
      year: +parts[0],
      month: +parts[1],
      day: +parts[2],
    };
  }

  downloadMouvementsEntreePDF(): void {
    // 🔥 VÉRIFICATION DE PERMISSION AVANT EXPORT
    if (!this.canExportStock) {
      alert('Vous n\'avez pas l\'autorisation d\'exporter les données de stock.');
      return;
    }

    this.entreeService.imprimerMouvementsEntree().subscribe(
      (response: Blob) => {
        const fileURL = window.URL.createObjectURL(response);
        const a = document.createElement('a');
        a.href = fileURL;
        a.download = 'liste_mouvements_entrees.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(fileURL);
      },
      error => {
        console.error('Erreur lors du téléchargement du PDF des mouvements d\'entrée:', error);
        alert('Impossible de télécharger le PDF. Veuillez vérifier votre connexion ou contacter l\'administrateur.');
      }
    );
  }

  // 🔥 MÉTHODE DE DEBUG (à supprimer en production)
  debugPermissions(): void {
    console.log('🔍 DEBUG PERMISSIONS:');
    console.log('canAddStock:', this.canAddStock);
    console.log('canModifyStock:', this.canModifyStock);
    console.log('canDeleteStock:', this.canDeleteStock);
    console.log('canExportStock:', this.canExportStock);
    console.log('hasPageAccess:', this.hasPageAccess);

    const allowedFonctionnalites = JSON.parse(localStorage.getItem('allowedFonctionnalites') || '[]');
    console.log('Fonctionnalités dans localStorage:', allowedFonctionnalites);
  }
}
