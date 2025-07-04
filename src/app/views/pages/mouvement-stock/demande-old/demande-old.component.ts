import { Component, ViewChild, OnInit, OnDestroy, inject } from '@angular/core';
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
import { Subject, takeUntil } from 'rxjs'; // Importez Subject et takeUntil
import { map } from 'rxjs/operators';
import { AbstractControl, ValidatorFn } from '@angular/forms';
import { Router } from '@angular/router';


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
    FeatherIconDirective
  ],
  templateUrl: 'demande-old.component.html'
})
export class SortieComponent implements OnInit, OnDestroy { // Implémentez OnDestroy

    // 🔥 PROPRIÉTÉS POUR LA GESTION DES PERMISSIONS
  allowedFonctionnalites: string[] = [];
  canViewDemande: boolean = true; // 🔥 DÉFAUT À TRUE pour éviter les blocages
  canTreatDemande: boolean = true;    // 🔥 DÉFAUT À TRUE pour éviter les blocages

  hasPageAccess: boolean = true;  // 🔥 DÉFAUT À TRUE pour éviter les blocages

  currentDate: NgbDateStruct = inject(NgbCalendar).getToday();
  rows: MouvementStock[] = [];
  temp: MouvementStock[] = [];
  loadingIndicator = true;
  reorderable = true;
  ColumnMode = ColumnMode;
  selectedStatut: string | null = null;

  articles: Article[] = []; // Liste des types articles
  bureaux: Bureau[] = []; // Liste des Bureaux
  employes: Employe[] = []; // Liste des Employe

  quantiteDisponible: number = 0;


  alertAjoutVisible: boolean = false;   // Pour gérer la visibilité de l'alerte ajout
  alertModifVisible: boolean = false;   // Pour gérer la visibilité de l'alerte mofid
  alertSuppVisible: boolean = false;   // Pour gérer la visibilité de l'alerte supp
  isStatutModifLoading = false;
  private destroy$ = new Subject<void>(); // Déclarez destroy$

  public addSortie!: FormGroup;
  public editSortie!: FormGroup;
  public deleteSortie!: FormGroup;
  public editStatutSortie!: FormGroup;

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
    }


    this.addSortie = this.formBuilder.group({
      id_Article: [null, [Validators.required]],
      id_personnel: [null, []],
      id_bureau: [null, []],
      description: ["", [Validators.required]],
      // qte: [1, [Validators.required]],
      qteDemande: [1, [Validators.required]],
      dateDemande: ["", [Validators.required]],
    });
    this.addSortie.get('id_personnel')?.valueChanges.subscribe(value => {
      const bureau = this.addSortie.get('id_bureau');
      if (value) {
        bureau?.setValidators([Validators.required]);
      } else {
        bureau?.clearValidators();
      }
      bureau?.updateValueAndValidity();
    });

    this.editSortie = this.formBuilder.group({
      id: [0, [Validators.required]],
      id_Article: [null, [Validators.required]],
      id_personnel: [null, []],
      id_bureau: [null, []],
      description: ["", [Validators.required]],
      // qte: [1, [Validators.required]],
      qteDemande: [1, [Validators.required]],
      date_mouvement: ["", [Validators.required]],
      statut: ['', Validators.required] // **Ajouter le statut au formulaire de modification**
    });
    this.deleteSortie = this.formBuilder.group({
      id: [0, [Validators.required]],
    });
    this.buildEditStatutSortieForm();
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
      this.canViewDemande = allowedFonctionnalites.includes('Voir Les demandes');
      this.canTreatDemande = allowedFonctionnalites.includes('Traiter de demande');
      // 🔥 ACCÈS À LA PAGE : Si au moins une fonctionnalité de stock est autorisée
      this.hasPageAccess = this.canViewDemande || this.canTreatDemande;

      console.log('🔐 Permissions calculées:', {
        canViewDemande: this.canViewDemande,
        canTreatDemande: this.canTreatDemande,
        hasPageAccess: this.hasPageAccess
      });

      // 🔥 SI AUCUN ACCÈS, REDIRIGER VERS LE DASHBOARD
      if (!this.hasPageAccess) {
        console.warn('❌ Accès refusé à la page des demandes de stock');
        this.router.navigate(['/error/403']);
        return;
      }

    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation des permissions:', error);
      // En cas d'erreur, garder les permissions par défaut (true)
    }
  }

  ngOnDestroy(): void { // Implémentez ngOnDestroy
    this.destroy$.next();
    this.destroy$.complete();
  }

  buildEditStatutSortieForm(): void {
    this.editStatutSortie = this.formBuilder.group({
      id: [null, Validators.required],
      statut: ['', Validators.required],
      qte: ['', Validators.required],
      date_mouvement: ['', Validators.required],
      qteDemande: [1, [Validators.required]],
    });
  }

  onClickSubmitEditStatutSortie(): void {
    const spinner = document.querySelector('#edit_statut_sortie .spinnerStatutModif');

    if (this.editStatutSortie.valid) {
      this.isStatutModifLoading = true;
      if (spinner) spinner.classList.remove('d-none');
      const id = this.editStatutSortie.value.id;
      const formData = { ...this.editStatutSortie.value,
        date_mouvement: this.formatDate(this.editStatutSortie.value.date_mouvement), // Convertir la date
      };
      delete formData.id;

      this.sortieService.updateDemandeStock(id, formData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            this.loadSorties();
            if (spinner) spinner.classList.add('d-none');
            this.editStatutSortie.reset();

            // Fermer le modal manuellement (selon votre exemple)
            const modal = document.getElementById('edit_statut_sortie');
            const bsModal = bootstrap.Modal.getInstance(modal);
            bsModal?.hide();

            // Attendre que le modal soit fermé avant d'afficher l'alerte (selon votre exemple)
            setTimeout(() => {
              this.alertModifVisible = true;
              console.log('Alert visible après fermeture du modal:', this.alertModifVisible);
              setTimeout(() => {
                this.alertModifVisible = false;
              }, 2000); // L'alerte disparaît après 2 secondes
            }, 200); // L'alerte apparaît 200ms après la fermeture du modal

            this.isStatutModifLoading = false;
          },
          error: (error: any) => {
            console.error('Erreur lors de la modification du statut :', error);
            if (spinner) spinner.classList.add('d-none');
            this.isStatutModifLoading = false;
            alert('Une erreur s\'est produite. Veuillez réessayer.'); // Gestion de l'erreur selon votre exemple
          }
        });
    } else {
      if (spinner) spinner.classList.add('d-none');
      alert("Désolé, le formulaire n'est pas bien renseigné"); // Gestion de l'erreur de validation selon votre exemple
      Object.keys(this.editStatutSortie.controls).forEach(key => {
        this.editStatutSortie.get(key)?.markAsTouched();
      });
    }
  }

  onClickSubmitAddSortie() {
    console.log(this.addSortie.value);
    const spinner = document.querySelector('.spinner-border');

    if (this.addSortie.valid) {
      if (spinner) spinner.classList.remove('d-none');
      const formData = {
        ...this.addSortie.value,
        dateDemande: this.formatDate(this.addSortie.value.dateDemande), // Convertir la date
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
          // console.error('Erreur lors de l\'ajout de la sortie :', error);
          // if (spinner) spinner.classList.add('d-none');
          // alert('Une erreur s\'est produite. Veuillez réessayer.');

          if (spinner) spinner.classList.add('d-none');

          // Afficher directement le message d'erreur de l'API
          alert(error.error?.error || "Une erreur s'est produite. Veuillez réessayer.");
        }
      );
    } else {
      if (spinner) spinner.classList.add('d-none');
      alert("Désolé, le formulaire n'est pas bien renseigné");
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
          alert('Une erreur s\'est produite. Veuillez réessayer.');
        }
      );
    } else {
      if (spinner) spinner.classList.add('d-none');
      alert("Désolé, le formulaire n'est pas bien renseigné");
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
          alert('Une erreur s\'est produite. Veuillez réessayer.');
        }
      );
    } else {
      if (spinner) spinner.classList.add('d-none');
      alert("Désolé, le formulaire n'est pas bien renseigné");
    }
  }

  loadArticles(): void {
    this.sortieService.getAllArticles().subscribe({
      next: (data: Article[]) => { // Typez la réponse
        this.articles = data; // Stocker la liste des articles
      },
      error: (err: any) => { // Typez l'erreur
        console.error("Erreur lors du chargement des articles :", err);
      }
    });
  }
  loadEmployes(): void {
    this.sortieService.getAllEmployes().subscribe({
      next: (data: Employe[]) => { // Typez la réponse
        this.employes = data.map((employe: any) => ({
          ...employe,
          fullName: `${employe.nom} ${employe.prenom}`
        })); // Ajouter fullName pour l'affichage
      },
      error: (err: any) => { // Typez l'erreur
        console.error("Erreur lors du chargement des employés :", err);
      }
    });
  }

  loadBureaux(): void {
    this.sortieService.getAllBureaux().subscribe({
      next: (data: Bureau[]) => { // Typez la réponse
        this.bureaux = data; // Stocker la liste des bureaux
      },
      error: (err: any) => { // Typez l'erreur
        console.error("Erreur lors du chargement des bureaux :", err);
      }
    });
  }


  loadSorties(): void {
    this.sortieService.getAllMouvementStockSortie().pipe(
      map((data: MouvementStock[]) =>
        data.filter(item => item.statut !== '')
      )
    ).subscribe(
      (data: MouvementStock[]) => { // Typez la réponse
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

  onStatutFilterChange(): void {
    if (this.selectedStatut) {
      this.rows = this.temp.filter(item => item.statut === this.selectedStatut);
    } else {
      this.rows = [...this.temp];
    }
  }


  // updateFilter(event: KeyboardEvent): void {
  //   const val = (event.target as HTMLInputElement).value.toLowerCase();

  //   this.rows = this.temp.filter(sortie =>
  //     sortie.description.toLowerCase().includes(val)
  //   );

  //   this.table.offset = 0;
  // }
  updateFilter(event: KeyboardEvent): void {
    const val = (event.target as HTMLInputElement).value.toLowerCase();

    this.rows = this.temp.filter(demandeSortie =>
      (demandeSortie.article && demandeSortie.article.libelle && demandeSortie.article.libelle.toLowerCase().includes(val)) ||
      (demandeSortie.description && demandeSortie.description.toLowerCase().includes(val)) ||
      (demandeSortie.qteDemande && String(demandeSortie.qteDemande).toLowerCase().includes(val)) ||
      (demandeSortie.employe && demandeSortie.employe.fullnameEmploye && demandeSortie.employe.fullnameEmploye.toLowerCase().includes(val)) ||
      (demandeSortie.bureau && demandeSortie.bureau.libelle_bureau && demandeSortie.bureau.libelle_bureau.toLowerCase().includes(val)) ||
      (demandeSortie.statut && demandeSortie.statut.toLowerCase().includes(val))
    );
    
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
      qteDemande: row.qteDemande,
      date_mouvement: this.convertToNgbDate(row.date_mouvement),
      statut: row.statut // **Récupérer le statut pour la modification**
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
      (response: any) => { // Typez la réponse
        console.log('Quantité disponible:', response.data);
        this.quantiteDisponible = response.data;

        // 🔥 On met à jour le validateur max du champ qte
        const qteControl = this.addSortie.get('qteDemande');
        qteControl?.setValidators([
          Validators.required,
          Validators.min(1),
          Validators.max(this.quantiteDisponible)
        ]);
        qteControl?.updateValueAndValidity();

      },
      (error: any) => {
        console.error('Erreur lors de la récupération de la quantité disponible:', error);
        this.quantiteDisponible = 0;
      }
    );
  }


  getStatutForm(row: any): void {
    this.editStatutSortie.patchValue({
      id: row.id,
      statut: row.statut,
      qteDemande: row.qteDemande
    });

    const idArticle = row.id_Article;
      console.log('ID de l\'article sélectionné:', idArticle);

      if (!idArticle) {
        console.log('Aucun article sélectionné ou désélection effectuée');
        this.quantiteDisponible = 0;
        return;
      }

      this.sortieService.getQuantiteDisponible(idArticle).subscribe(
        (response: any) => { // Typez la réponse
          console.log('Quantité disponible:', response.data);
          this.quantiteDisponible = response.data;

          // 🔥 On met à jour le validateur max du champ qte
          const qteControl = this.editStatutSortie.get('qte');
          qteControl?.setValidators([
            Validators.required,
            Validators.min(1),
            Validators.max(this.quantiteDisponible)
          ]);
          qteControl?.updateValueAndValidity();

        },
        (error: any) => {
          console.error('Erreur lors de la récupération de la quantité disponible:', error);
          this.quantiteDisponible = 0;
        }
      );
  }

   bureauRequiredIfEmployeFilled(): ValidatorFn {
    return (group: AbstractControl): { [key: string]: any } | null => {
      const employe = group.get('id_personnel')?.value;
      const bureau = group.get('id_bureau')?.value;

      if (employe && !bureau) {
        return { bureauRequired: true };
      }

      return null;
    };
  }


}
