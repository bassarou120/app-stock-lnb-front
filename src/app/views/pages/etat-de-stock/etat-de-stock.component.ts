import { Component, ViewChild, OnInit } from '@angular/core';
import { ColumnMode, DatatableComponent, NgxDatatableModule } from '@siemens/ngx-datatable';
import { ArticleService } from '../../../core/services/articles/articles.service';
import { Categorie, Article } from '../../../core/services/interface/models';
import { CommonModule } from '@angular/common';
import { NgSelectModule } from '@ng-select/ng-select';
import { FormsModule } from '@angular/forms';  // Ajoutez cette importation

declare var bootstrap: any;

@Component({
  selector: 'app-articles',
  standalone: true,
  imports: [
    NgxDatatableModule,
    NgSelectModule,
    CommonModule,
    FormsModule,  // Ajoutez ce module pour utiliser ngModel
  ],
  templateUrl: 'etat-de-stock.component.html',
  styleUrls: ['etat-de-stock.component.scss']
})
export class EtatStockComponent implements OnInit {
  rows: Article[] = [];
  temp: Article[] = [];
  loadingIndicator = true;
  reorderable = true;
  ColumnMode = ColumnMode;
  categories: Categorie[] = []; // Liste des catégories d'articles
  selectedCategoryId: number | null = null;  // Ajoutez cette propriété

  @ViewChild('table') table!: DatatableComponent;

  constructor(private articleService: ArticleService) {}

  // Variable pour stocker le texte de recherche
  searchText: string = '';
  ngOnInit(): void {
    this.loadCategories();
    this.loadArticles();
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
}
