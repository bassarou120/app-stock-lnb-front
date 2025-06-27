import { Component, ViewChild, OnInit } from '@angular/core';
import { ColumnMode, DatatableComponent, NgxDatatableModule } from '@siemens/ngx-datatable';
import { ArticleService } from '../../../core/services/articles/articles.service';
import { Categorie, Article } from '../../../core/services/interface/models';
import { CommonModule } from '@angular/common';
import { NgSelectModule } from '@ng-select/ng-select';
import { FormsModule } from '@angular/forms';  // Ajoutez cette importation
import { Router } from '@angular/router';

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

  // PROPRIÉTÉS POUR LA GESTION DES PERMISSIONS
  allowedFonctionnalites: string[] = [];
  canViewEtatStock: boolean = true;    // DÉFAUT À TRUE pour éviter les blocages
  canExportEtatStock: boolean = true; // DÉFAUT À TRUE pour éviter les blocages
  hasPageAccess: boolean = true;  //  DÉFAUT À TRUE pour éviter les blocages


  rows: Article[] = [];
  temp: Article[] = [];
  loadingIndicator = true;
  reorderable = true;
  ColumnMode = ColumnMode;
  categories: Categorie[] = []; // Liste des catégories d'articles
  selectedCategoryId: number | null = null;  // Ajoutez cette propriété

  @ViewChild('table') table!: DatatableComponent;

  constructor(private articleService: ArticleService, private router: Router){}

  // Variable pour stocker le texte de recherche
  searchText: string = '';
  ngOnInit(): void {
    // 🔥 INITIALISER LES PERMISSIONS EN PREMIER
    this.initializePermissions();
    // Ensuite charger les données seulement si on a accès
    if (this.hasPageAccess) {
        this.loadCategories();
        this.loadArticles();
    }
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
      this.canViewEtatStock = allowedFonctionnalites.includes('Voir Etat de Stock');
      this.canExportEtatStock = allowedFonctionnalites.includes('Export Stock')

      // 🔥 ACCÈS À LA PAGE : Si au moins une fonctionnalité de stock est autorisée
      this.hasPageAccess = this.canViewEtatStock ;
                          

      console.log('🔐 Permissions calculées:', {
        canViewEtatStock: this.canViewEtatStock,
        canExportEtatStock: this.canExportEtatStock,
        hasPageAccess: this.hasPageAccess
      });

      // 🔥 SI AUCUN ACCÈS, REDIRIGER VERS LE DASHBOARD
      if (!this.hasPageAccess) {
        console.warn('❌ Accès refusé à la page des etats de stock');
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
    this.canViewEtatStock = true;
    this.canExportEtatStock = true;
    this.hasPageAccess = true;
    console.log('✅ Permissions par défaut appliquées');
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

  downloadEtatStock() {
    // 🔥 VÉRIFICATION DE PERMISSION AVANT EXPORT
    if (!this.canExportEtatStock) {
      alert('Vous n\'avez pas l\'autorisation d\'exporter l`\'etat du stock.');
      return;
    }

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
}
