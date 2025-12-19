import { Component, ViewChild, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ColumnMode, DatatableComponent, NgxDatatableModule } from '@siemens/ngx-datatable';
import { MouvementStockService } from '../../../../core/services/mouvementstock/sortie.service';
import { MouvementStock, Article, Bureau, Employe } from '../../../../core/services/interface/models';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule, FormArray } from "@angular/forms";
import { CommonModule } from '@angular/common';
import { NgbAlertModule, NgbDatepickerModule, NgbCalendar } from '@ng-bootstrap/ng-bootstrap';
import { NgbDropdownModule, NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { NgSelectComponent as MyNgSelectComponent } from '@ng-select/ng-select';
import { FeatherIconDirective } from '../../../../core/feather-icon/feather-icon.directive';
import { map } from 'rxjs/operators';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';  

declare var bootstrap: any;

@Component({
  selector: 'app-sortie',
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
    FeatherIconDirective,
  ],
  templateUrl: 'sortie.component.html'
})
export class SortieComponent implements OnInit {

  // 🔥 PROPRIÉTÉS POUR LA GESTION DES PERMISSIONS
  allowedFonctionnalites: string[] = [];
  canViewSortie: boolean = true; // 🔥 DÉFAUT À TRUE pour éviter les blocages

  hasPageAccess: boolean = true;  // 🔥 DÉFAUT À TRUE pour éviter les blocages

  currentDate: NgbDateStruct = inject(NgbCalendar).getToday();
  rows: MouvementStock[] = [];
  temp: MouvementStock[] = [];
  loadingIndicator = true;
  reorderable = true;
  ColumnMode = ColumnMode;

  articles: Article[] = []; // Liste des types articles
  bureaux: Bureau[] = []; // Liste des Bureaux
  employes: Employe[] = []; // Liste des Employe

  quantiteDisponible: number = 0;


  alertAjoutVisible: boolean = false;  // Pour gérer la visibilité de l'alerte ajout
  alertModifVisible: boolean = false;  // Pour gérer la visibilité de l'alerte mofid
  alertSuppVisible: boolean = false;  // Pour gérer la visibilité de l'alerte supp

  public addSortie!: FormGroup;
  public editSortie!: FormGroup;
  public deleteSortie!: FormGroup;

  // Fichiers sélectionnés

  @ViewChild('table') table!: DatatableComponent;

  constructor(private sortieService: MouvementStockService, private formBuilder: FormBuilder, private router: Router) { }

  ngOnInit(): void {

    // 🔥 INITIALISER LES PERMISSIONS EN PREMIER
    this.initializePermissions();
    // Ensuite charger les données seulement si on a accès
    if (this.hasPageAccess) {
      this.loadEmployes();
      this.loadArticles();
      this.loadBureaux();
      this.loadSorties();
      this.loadSortiesAccordees(); // Charger uniquement les sorties accordées au début
    }


    this.addSortie = this.formBuilder.group({
      id_Article: [null, [Validators.required]],
      id_employe: [null, []],
      id_bureau: [null, []],
      description: ["", [Validators.required]],
      qte: [1, [Validators.required]],
      date_mouvement: ["", [Validators.required]],
    });
    this.editSortie = this.formBuilder.group({
      id: [0, [Validators.required]],
      id_Article: [null, [Validators.required]],
      id_employe: [null, []],
      id_bureau: [null, []],
      description: ["", [Validators.required]],
      qte: [1, [Validators.required]],
      date_mouvement: ["", [Validators.required]],
    });
    this.deleteSortie = this.formBuilder.group({
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
      this.canViewSortie = allowedFonctionnalites.includes('Sorties de Stock');
      // 🔥 ACCÈS À LA PAGE : Si au moins une fonctionnalité de stock est autorisée
      this.hasPageAccess = this.canViewSortie;

      console.log('🔐 Permissions calculées:', {
        canViewSortie: this.canViewSortie,
        hasPageAccess: this.hasPageAccess
      });

      // 🔥 SI AUCUN ACCÈS, REDIRIGER VERS LE DASHBOARD
      if (!this.hasPageAccess) {
        console.warn('❌ Accès refusé à la page des sorties de stock');
        this.router.navigate(['/error/403']);
        return;
      }

    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation des permissions:', error);
      // En cas d'erreur, garder les permissions par défaut (true)
    }
  }


  onClickSubmitAddSortie() {
    console.log(this.addSortie.value);
    const spinner = document.querySelector('.spinner-border');

    if (this.addSortie.valid) {
      if (spinner) spinner.classList.remove('d-none');
      const formData = {
        ...this.addSortie.value,
        date_mouvement: this.formatDate(this.addSortie.value.date_mouvement), // Convertir la date
      };
      this.sortieService.saveMouvementStockSortie(formData).subscribe(
        (data: any) => {
          this.loadSorties();
          if (spinner) spinner.classList.add('d-none');
          this.addSortie.reset();

          // Fermer le modal manuellement
          const modal = document.getElementById('add_sortie');
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
                    console.error('Erreur lors de l\'ajout de la sortie :', error);
                    if (spinner) spinner.classList.add('d-none');
          
                    // --- Logique d'affichage du message améliorée ---
                    let detail = 'Veuillez vérifier vos données et réessayer l\'enregistrement.';
          
                    if (error.status === 422) {
                      // Erreur de validation (quantité insuffisante, champ manquant)
                      detail = 'Erreur de Validation : Les données fournies sont invalides. Cela peut indiquer une **quantité insuffisante en stock** ou un champ obligatoire manquant.';
          
                      // Tenter d'extraire le message d'erreur du serveur s'il est plus précis
                      if (error.error && error.error.error) {
                        detail = `Erreur de Validation : ${error.error.error}`;
                      }
                    } else if (error.status === 401 || error.status === 403) {
                      // Erreur d'autorisation
                      detail = 'Accès refusé. Vous n\'avez pas les permissions pour enregistrer une sortie de stock.';
                    } else if (error.status === 0) {
                      // Erreur de réseau ou serveur injoignable
                      detail = 'Erreur de connexion : Impossible de communiquer avec le serveur pour enregistrer la sortie.';
                    } else if (error.error && error.error.error) {
                      // Afficher le message d'erreur du serveur s'il est disponible
                      detail = `Erreur Serveur: ${error.error.error}`;
                    }
          
                    // Message final clair
                    Swal.fire({
                      title: 'Erreur',
                      text: 'L\'enregistrement de la sortie de stock a échoué.\n\nDétails : ${detail}\n\nSi le problème persiste, veuillez contacter le support technique.',
                      icon: 'error',
                      confirmButtonText: 'Réessayer',
                      confirmButtonColor: '#d33'
                    });
                  }
                );
    } else {
      if (spinner) spinner.classList.add('d-none');
      Swal.fire({
        title: 'Erreur',
        text: 'Désolé, le formulaire n\'est pas bien renseigné',
        icon: 'error',
        confirmButtonText: 'Réessayer',
        confirmButtonColor: '#d33'
      });
    }
  }

  onClickSubmitEditSortie() {
    console.log(this.editSortie.value);
    const spinner = document.querySelector('.spinnerModif');

    if (this.editSortie.valid) {
      if (spinner) spinner.classList.remove('d-none');
      const id = this.editSortie.value.id;
      const formData = {
        ...this.editSortie.value,
        date_mouvement: this.formatDate(this.editSortie.value.date_mouvement), // Convertir la date
      };
      this.sortieService.editMouvementStockSortie(formData).subscribe(
        (data: any) => {
          this.loadSorties();
          if (spinner) spinner.classList.add('d-none');
          this.editSortie.reset();

          // Fermer le modal manuellement
          const modal = document.getElementById('edit_sortie');
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
                    console.error('Erreur lors de la modification de la sortie :', error);
                    if (spinner) spinner.classList.add('d-none');
          
                    // --- Logique d'affichage du message améliorée ---
                    let detail = 'Veuillez vérifier vos données et réessayer l\'enregistrement.';
          
                    if (error.status === 422) {
                      // Erreur de validation (quantité insuffisante, champ manquant)
                      detail = 'Erreur de Validation : Les données fournies sont invalides. Assurez-vous que la quantité demandée est inférieure ou égale au stock disponible.';
          
                      // Tenter d'extraire le message d'erreur du serveur s'il est plus précis
                      if (error.error && error.error.error) {
                        detail = `Erreur de Validation : ${error.error.error}`;
                      }
                    } else if (error.status === 404) {
                      // La sortie à modifier n'existe plus
                      detail = 'La sortie de stock que vous tentez de modifier est introuvable. Elle a peut-être été supprimée par un autre utilisateur.';
                    } else if (error.status === 401 || error.status === 403) {
                      // Erreur d'autorisation
                      detail = 'Accès refusé. Vous n\'avez pas les permissions pour modifier cette sortie de stock.';
                    } else if (error.status === 0) {
                      // Erreur de réseau ou serveur injoignable
                      detail = 'Erreur de connexion : Impossible de communiquer avec le serveur pour modifier la sortie.';
                    } else if (error.error && error.error.error) {
                      // Afficher le message d'erreur du serveur s'il est disponible
                      detail = `Erreur Serveur: ${error.error.error}`;
                    }
          
                    // Message final clair
                    Swal.fire({
                      title: 'Erreur',
                      text: 'La modification de la sortie de stock a échoué.\n\nDétails : ${detail}\n\nSi le problème persiste, veuillez contacter le support technique.',
                      icon: 'error',
                      confirmButtonText: 'Réessayer',
                      confirmButtonColor: '#d33'
                    });
                  }
                );
    } else {
      if (spinner) spinner.classList.add('d-none');
      Swal.fire({
        title: 'Erreur',
        text: 'Désolé, le formulaire n\'est pas bien renseigné',
        icon: 'error',
        confirmButtonText: 'Réessayer',
        confirmButtonColor: '#d33'
      });
    }
  }

  onClickSubmitDeleteSortie() {
    console.log(this.deleteSortie.value);
    const spinner = document.querySelector('.spinnerDelete');

    if (this.deleteSortie.valid) {
      if (spinner) spinner.classList.remove('d-none');
      this.sortieService.deleteMouvementStockSortie(this.deleteSortie.value).subscribe(
        (data: any) => {
          this.loadSorties();
          if (spinner) spinner.classList.add('d-none');
          this.deleteSortie.reset();

          // Fermer le modal manuellement
          const modal = document.getElementById('delete_sortie');
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
                    console.error('Erreur lors de la supression de la sortie :', error);
                    if (spinner) spinner.classList.add('d-none');
                    
                    // --- Logique d'affichage du message améliorée ---
                    let detail = 'Veuillez réessayer l\'opération. Si l\'erreur persiste, contactez le support.';
          
                    if (error.status === 404) {
                      // Erreur 404 si la sortie à supprimer n'est plus trouvée
                      detail = 'La sortie de stock sélectionnée est introuvable. Elle a peut-être déjà été supprimée ou n\'existe pas.';
                    } else if (error.status === 401 || error.status === 403) {
                      // Erreur d'autorisation
                      detail = 'Accès refusé. Vous n\'avez pas les permissions pour supprimer cette sortie.';
                    } else if (error.status === 400 || error.status === 500) {
                      // Erreur si la sortie est bloquée par une règle métier (ex: rapport finalisé)
                      detail = 'Impossible de supprimer cette sortie. Elle est peut-être liée à une transaction ou son statut ne permet plus la suppression.';
                      // Tenter d'afficher le message du serveur s'il est plus précis
                      if (error.error && error.error.error) {
                        detail = `Raison : ${error.error.error}`;
                      }
                    } else if (error.status === 0) {
                      // Erreur de réseau
                      detail = 'Erreur de connexion : Le serveur est injoignable. Veuillez vérifier votre connexion Internet.';
                    }
          
                    // Message final clair
                    Swal.fire({
                      title: 'Erreur',
                      text: 'La suppression de la sortie de stock a échoué.\n\nDétails : ${detail}\n\nEn cas d\'échec répété, veuillez contacter le support technique.',
                      icon: 'error',
                      confirmButtonText: 'Réessayer',
                      confirmButtonColor: '#d33'
                    });
                  }
                );
    } else {
      if (spinner) spinner.classList.add('d-none');
      Swal.fire({
        title: 'Erreur',
        text: 'Désolé, le formulaire n\'est pas bien renseigné',
        icon: 'error',
        confirmButtonText: 'Réessayer',
        confirmButtonColor: '#d33'
      });
    }
  }

  loadArticles(): void {
    this.sortieService.getAllArticles().subscribe({
      next: (data) => {
        this.articles = data; // Stocker la liste des articles
      },
      error: (err) => {
        console.error("Erreur lors du chargement des articles :", err);
      }
    });
  }

  downloadMouvementsSortiePDF(): void {
    // 🔥 VÉRIFICATION DE PERMISSION AVANT EXPORT

    this.sortieService.imprimerMouvementsSortie().subscribe(
      (response: Blob) => {
        const fileURL = window.URL.createObjectURL(response);
        const a = document.createElement('a');
        a.href = fileURL;
        a.download = 'liste_mouvements_sorties.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(fileURL);
      },
      error => {
        console.error('Erreur lors du téléchargement du PDF des mouvements de sortie:', error);
        Swal.fire({
          title: 'Erreur',
          text: 'Impossible de télécharger le PDF. Veuillez vérifier votre connexion ou contacter l\'administrateur.',
          icon: 'error',
          confirmButtonText: 'Réessayer',
          confirmButtonColor: '#d33'
        });
      }
    );
  }

  loadEmployes(): void {
    this.sortieService.getAllEmployes().subscribe({
      next: (data) => {
        this.employes = data.map((employe: any) => ({
          ...employe,
          fullName: `${employe.nom} ${employe.prenom}`
        })); // Ajouter fullName pour l'affichage
      },
      error: (err) => {
        console.error("Erreur lors du chargement des employés :", err);
      }
    });
  }

  loadBureaux(): void {
    this.sortieService.getAllBureaux().subscribe({
      next: (data) => {
        this.bureaux = data; // Stocker la liste des bureaux
      },
      error: (err) => {
        console.error("Erreur lors du chargement des bureaux :", err);
      }
    });
  }


  loadSorties(): void {
    this.sortieService.getAllMouvementStockSortie().subscribe(
      (data: MouvementStock[]) => {
        this.temp = [...data]; // Sauvegarde de la liste complète pour la recherche
        this.rows = data;
        this.loadingIndicator = false;
      },
      error => {
        console.error('Erreur lors du chargement des Mouvements Stock Sortie', error);
        this.loadingIndicator = false;
      }
    );
  }

  loadSortiesAccordees(): void {
    this.sortieService.getAllMouvementStockSortie().pipe(
      map((data: MouvementStock[]) => data.filter(sortie => sortie.statut === 'Cloturé'))
    ).subscribe(
      (data: MouvementStock[]) => {
        this.temp = [...data]; // Sauvegarde de la liste filtrée pour la recherche
        this.rows = data;
        this.loadingIndicator = false;
      },
      error => {
        console.error('Erreur lors du chargement des Mouvements Stock Sortie cloturé', error);
        this.loadingIndicator = false;
      }
    );
  }

  // updateFilter(event: KeyboardEvent): void {
  //   const val = (event.target as HTMLInputElement).value.toLowerCase();

  //   this.rows = this.temp.filter(sortie =>
  //     sortie.code_mouvement?.toLowerCase().includes(val)
  //   );

  //   this.table.offset = 0;
  // }
  updateFilter(event: KeyboardEvent): void {
    const val = (event.target as HTMLInputElement).value.toLowerCase();

    this.rows = this.temp.filter(mouvementSortie =>
      (mouvementSortie.code_mouvement && mouvementSortie.code_mouvement.toLowerCase().includes(val)) ||
      (mouvementSortie.article && mouvementSortie.article.libelle && mouvementSortie.article.libelle.toLowerCase().includes(val)) ||
      (mouvementSortie.description && mouvementSortie.description.toLowerCase().includes(val)) ||
      (mouvementSortie.qte && String(mouvementSortie.qte).toLowerCase().includes(val)) ||
      (mouvementSortie.employe && mouvementSortie.employe.fullnameEmploye && mouvementSortie.employe.fullnameEmploye.toLowerCase().includes(val)) ||
      (mouvementSortie.bureau && mouvementSortie.bureau.libelle_bureau && mouvementSortie.bureau.libelle_bureau.toLowerCase().includes(val))
    );

    // Important : réinitialiser l'offset de la table pour afficher les résultats filtrés depuis le début
    this.table.offset = 0;
  }

  getEditForm(row: any) {
    this.editSortie.patchValue({
      id: row.id,
      id_Article: row.id_Article,
      description: row.description,
      id_bureau: row.affectation?.id_bureau,
      id_employe: row.affectation?.employe?.id,
      qte: row.qte,
      date_mouvement: this.convertToNgbDate(row.date_mouvement),
    })
  }

  getDeleteForm(row: any) {
    this.deleteSortie.patchValue({
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

  formatEmploye(employe: any): string {
    return employe ? `${employe.nom} ${employe.prenom}` : '';
  }

  updateQuantiteDisponible() {
    const idArticle = this.addSortie.get('id_Article')?.value;
    console.log('ID de l\'article sélectionné:', idArticle);

    if (!idArticle) {
      console.log('Aucun article sélectionné ou désélection effectuée');
      this.quantiteDisponible = 0;
      return;
    }

    this.sortieService.getQuantiteDisponible(idArticle).subscribe(
      (response) => {
        console.log('Quantité disponible:', response.data);
        this.quantiteDisponible = response.data;

        // 🔥 On met à jour le validateur max du champ qte
        const qteControl = this.addSortie.get('qte');
        qteControl?.setValidators([
          Validators.required,
          Validators.min(1),
          Validators.max(this.quantiteDisponible)
        ]);
        qteControl?.updateValueAndValidity();

      },
      (error) => {
        console.error('Erreur lors de la récupération de la quantité disponible:', error);
        this.quantiteDisponible = 0;
      }
    );

  }
}

