import { Component, ViewChild, OnInit, inject } from '@angular/core';
import { ColumnMode, DatatableComponent, NgxDatatableModule } from '@siemens/ngx-datatable';
import { MouvementStockService } from '../../../../core/services/mouvementstock/entree.service';
import { ArticleService } from '../../../../core/services/articles/articles.service';
import { StockService } from '../../../../core/services/rapport/stock/stock.service';
import { FournisseursService } from '../../../../core/services/fournisseurs/fournisseurs.service';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule, FormArray } from "@angular/forms";
import { NgbDropdownModule, NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';
import { NgbAlertModule, NgbDatepickerModule, NgbCalendar } from '@ng-bootstrap/ng-bootstrap';
import { Categorie, Article, MouvementStock, Fournisseur, TypeMouvement, Employe } from '../../../../core/services/interface/models';

import { CommonModule } from '@angular/common';
import { NgSelectModule } from '@ng-select/ng-select';
import { FormsModule, FormControl } from '@angular/forms';  // Ajoutez cette importation
import { EmployesService } from '../../../../core/services/employes/employes.service';


 
declare var bootstrap: any;

@Component({
  selector: 'app-articles',
  standalone: true,
  imports: [
    NgxDatatableModule,
    NgSelectModule,
    CommonModule,
    FormsModule,  // Ajoutez ce module pour utiliser ngModel
    NgxDatatableModule,
    ReactiveFormsModule,
    NgbDatepickerModule,
    CommonModule,
    FormsModule,
  ],
  templateUrl: 'stock.component.html',
  styleUrls: ['stock.component.scss']
})
export class StockComponent implements OnInit {
    currentDate: NgbDateStruct = inject(NgbCalendar).getToday();
  rows: any[] = [];
  temp: Article[] = [];

  rowsmouvemententre: MouvementStock[] = [];
  tempmouvemententre: MouvementStock[] = [];

  loadingIndicator = true;

// Pour les fournisseurs
rowsFournisseur: Fournisseur[] = [];
tempFournisseur: Fournisseur[] = [];
loadingIndicatorFournisseur = true;

  reorderable = true;
  ColumnMode = ColumnMode;
  categories: Categorie[] = []; // Liste des catégories d'articles
  selectedCategoryId: number | null = null;  // Ajoutez cette propriété

  mouvements: MouvementStock[] = [];  // tableau pour stocker les mouvements
  loading: boolean = false;            // booléen pour indiquer le chargement
  errorMessage: string = '';
  articles: Article[] = []; // Liste des types articles
  fournisseurs: Fournisseur[] = []; // Liste des Fournisseurs
  employes: Employe[] = []; // Liste des employes
  entreestock : MouvementStock[] = [];
  typeMouvements:TypeMouvement[] = [];
  date_debut: any;
  date_fin: any;
  selectedTypeMouvement: TypeMouvement | null = null;
  isEntreeStock: boolean = false;
  isSortieStock: boolean = false;
  defaultType:number;

  public formRecherche!: FormGroup;


  @ViewChild('table') table!: DatatableComponent;

  constructor(private articleService: ArticleService, private stockService: StockService, private fournisseurService: FournisseursService, private employeService: EmployesService, private formBuilder: FormBuilder){}


  // Variable pour stocker le texte de recherche
  searchText: string = '';
  ngOnInit(): void {
    this.loadCategories();
    this.loadArticles();
    this.loadFournisseurs();
    this.loadTypeMouvement();
    this.loadEmployes();

    // this.formRecherche = this.formBuilder.group({
    //   id_type_mouvement: [null, [Validators.required]],
    //   id_Article: [null, []],
    //   id_fournisseur: [null, []],
    //   date_debut: [null, Validators.required],  // ou une valeur par défaut comme new Date()
    //   date_fin: [null, Validators.required],
    // });
    this.initializeForm();

  }

  initializeForm(): void {
    this.formRecherche = this.formBuilder.group({
      id_type_mouvement: [this.defaultType, [Validators.required]],
      id_Article: [null, []],
      date_debut: [null, Validators.required],
      date_fin: [null, Validators.required],
    });

    // Écouter les changements du type de mouvement
    this.formRecherche.get('id_type_mouvement')?.valueChanges.subscribe(value => {
      this.onTypeMouvementChange(value);
      console.log(value);
    });
  }

  onTypeMouvementChange(typeMouvementId: number): void {
    if (!typeMouvementId) {
      this.selectedTypeMouvement = null;
      this.isEntreeStock = false;
      this.isSortieStock = false;
      return;
    }

    // Trouver le type de mouvement sélectionné
    this.selectedTypeMouvement = this.typeMouvements.find(type => type.id === typeMouvementId) || null;


    if (this.selectedTypeMouvement) {

      const typeLabel = this.selectedTypeMouvement.libelle_type_mouvement?.toLowerCase() || '';

      if (typeLabel=="entrée de stock") {
        this.isEntreeStock=true;
        this.isSortieStock=false;
      }else if (typeLabel== "sortie de stock") {
        this.isEntreeStock=false;
        this.isSortieStock=true;
      }


      console.log(this.isEntreeStock);
      console.log(this.isSortieStock);
      console.log(typeLabel);

      // Reconstruire le formulaire en fonction du type
      this.rebuildForm();
    }
  }

  rebuildForm(): void {
  const currentValues = this.formRecherche.value;

  if (this.isEntreeStock) {
    this.formRecherche.addControl('id_fournisseur', new FormControl(currentValues.id_fournisseur || null));
    this.formRecherche.removeControl('id_employe');
  } else if (this.isSortieStock) {
    this.formRecherche.addControl('id_employe', new FormControl(currentValues.id_employe || null));
    this.formRecherche.removeControl('id_fournisseur');
  } else {
    this.formRecherche.removeControl('id_fournisseur');
    this.formRecherche.removeControl('id_employe');
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


  loadFournisseurs(): void {
    this.fournisseurService.getAllFournisseurs().subscribe(
      (data: Fournisseur[]) => {
        this.fournisseurs = data;
        this.loadingIndicator = false;
      },
      error => {
        console.error('Erreur lors du chargement des Fournisseurs', error);
        this.loadingIndicator = false;
      }
    );
  }
  loadEmployes(): void {
    this.employeService.getAllEmployes().subscribe(
      (data: Employe[]) => {
        this.employes = data;
        this.loadingIndicator = false;
      },
      error => {
        console.error('Erreur lors du chargement des employes', error);
        this.loadingIndicator = false;
      }
    );
  }

  loadArticles(): void {
    this.articleService.getAllArticles().subscribe(
      (data: Article[]) => {
        this.articles = data;
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
    this.searchText = val; // Sauvegarder la valeur de recherche

    // Appliquer les filtres combinés (texte + catégorie)
    this.applyFilters();

    if (this.table) {
      this.table.offset = 0;
    }
  }

  filterByCategory(event: any): void {
    const categoryId = event ? event.id : null;
    console.log("Catégorie sélectionnée:", categoryId);
    this.selectedCategoryId = categoryId;

    // Appliquer les filtres combinés (texte + catégorie)
    this.applyFilters();

    if (this.table) {
      this.table.offset = 0;
    }
  }

  // Nouvelle méthode pour appliquer les deux filtres combinés
applyFilters(): void {
  // On part de la liste complète des articles
  let filteredRows = [...this.temp];

  // Si une catégorie est sélectionnée, on filtre par catégorie
  if (this.selectedCategoryId) {
    filteredRows = filteredRows.filter(article =>
      article.id_cat === this.selectedCategoryId
    );
  }

  // Si un texte de recherche est saisi, on filtre par texte
  if (this.searchText) {
    filteredRows = filteredRows.filter(article =>
      article.libelle.toLowerCase().includes(this.searchText.toLowerCase())
    );
  }

  // On met à jour la liste des articles affichés
  this.rows = filteredRows;
}

  // Méthode pour obtenir le nom de la catégorie à partir de son ID
  getCategoryName(categoryId: number): string | undefined {
    if (!categoryId) return undefined;

    const category = this.categories.find(cat => cat.id === categoryId);
    return category ? category.libelle_categorie_article : undefined;
  }

  downloadEtatStock() {
    this.articleService.imprimerEtatStock().subscribe((response: Blob) => {
      const fileURL = window.URL.createObjectURL(response);
      const a = document.createElement('a');
      a.href = fileURL;
      a.download = 'etat_du_stock.pdf'; // Nom du fichier à télécharger
      a.click();
    }, error => {
      console.error('Erreur lors du téléchargement du PDF', error);
    });
  }

  exportExcel() {
    this.articleService.downloadExcel().subscribe(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'etat_du_stock.xlsx';
      a.click();
      window.URL.revokeObjectURL(url);
    }, error => {
      console.error('Erreur lors du téléchargement du fichier', error);
    });
  }

loadRapport_entrerstock(): void {
  console.log("Appelle....")
if (this.formRecherche.invalid) {
  this.errorMessage = "Veuillez remplir les champs obligatoires.";
  console.warn('Formulaire invalide:', this.formRecherche.value);
  console.warn('Erreurs:', this.formRecherche.errors);
  return;
}
  console.log( this.formRecherche.value)

  const params = this.formRecherche.value;

  this.loading = true;
  this.errorMessage = '';
  const formData = {
        ...this.formRecherche.value,
        date_fin: this.formatDate(this.formRecherche.value.date_fin), // Convertir la date
        date_debut: this.formatDate(this.formRecherche.value.date_debut), // Convertir la date
      };
      console.log("date formaté :" + formData);
  this.stockService.getRapportEntreeStock(formData).subscribe({
    next: (resultats) => {
      this.rows = resultats.data.data;
      this.loading = false;
      console.log(this.rows);
    },
    error: (err) => {
      this.errorMessage = "Erreur lors du chargement des mouvements d'entrée.";
      console.error('Erreur API:', err);
      this.loading = false;
    }
  });
}

  loadTypeMouvement(): void {
    this.stockService.getAllTypeMouvement().subscribe(
      (data: TypeMouvement[]) => {
        this.typeMouvements = data;
        this.defaultType = data[0].id;
        console.log( "voici le premier " + this.defaultType);
        this.loadingIndicator = false;
      },
      (error) => {
        console.error("Erreur de chargement :", error);
        this.loadingIndicator = false;
      }

    );
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

}
