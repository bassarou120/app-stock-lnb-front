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
    NgbDatepickerModule
  ],
  templateUrl: 'sortie.component.html'
})
export class SortieComponent implements OnInit {

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

  constructor(private sortieService: MouvementStockService, private formBuilder: FormBuilder,) { }

  ngOnInit(): void {
    this.loadEmployes();
    this.loadArticles();
    this.loadBureaux();
    this.loadSorties();
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
      next: (data) => {
        this.articles = data; // Stocker la liste des articles
      },
      error: (err) => {
        console.error("Erreur lors du chargement des articles :", err);
      }
    });
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

  updateFilter(event: KeyboardEvent): void {
    const val = (event.target as HTMLInputElement).value.toLowerCase();

    this.rows = this.temp.filter(sortie =>
      sortie.description.toLowerCase().includes(val)
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





