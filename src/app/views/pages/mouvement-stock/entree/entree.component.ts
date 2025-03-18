import { Component, ViewChild, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ColumnMode, DatatableComponent, NgxDatatableModule } from '@siemens/ngx-datatable';
import { MouvementStockService } from '../../../../core/services/mouvementstock/entree.service';
import { MouvementStock, Article, Fournisseur } from '../../../../core/services/interface/models';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule  } from "@angular/forms";
import { CommonModule } from '@angular/common';
import { NgbAlertModule, NgbDatepickerModule, NgbCalendar } from '@ng-bootstrap/ng-bootstrap';
import { NgbDropdownModule, NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { NgSelectComponent as MyNgSelectComponent } from '@ng-select/ng-select';
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
    NgbDatepickerModule
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

  public addEntree!: FormGroup ;
  public editEntree!: FormGroup ;
  public deleteEntree!: FormGroup ;

  @ViewChild('table') table!: DatatableComponent;

  constructor(private entreeService: MouvementStockService,private formBuilder: FormBuilder,) {}

  ngOnInit(): void {
    this.loadArticles();
    this.loadFournisseurs();
    this.loadEntrees();
    this.addEntree = this.formBuilder.group({
      id_Article: [null, [Validators.required]],
      id_fournisseur: [null, [Validators.required]],
      description: ["", [Validators.required]],
      qte: [1, [Validators.required]],
      date_mouvement: ["" ,[Validators.required]],
   });
    this.editEntree = this.formBuilder.group({
      id: [0, [Validators.required]],
      id_Article: [null, [Validators.required]],
      id_fournisseur: [null, [Validators.required]],
      description: ["", [Validators.required]],
      qte: [1, [Validators.required]],
      date_mouvement: ["" ,[Validators.required]],
   });
    this.deleteEntree = this.formBuilder.group({
      id: [0, [Validators.required]],
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

onClickSubmitEditEntree(){
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

onClickSubmitDeleteEntree(){
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

  getEditForm(row: any){
    this.editEntree.patchValue({
     id:row.id,
     id_Article:row.id_Article,
     id_fournisseur:row.id_fournisseur,
     description:row.description,
     qte:row.qte,
     date_mouvement:this.convertToNgbDate(row.date_mouvement),
    })
  }

  getDeleteForm(row: any){
    this.deleteEntree.patchValue({
     id:row.id,
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


