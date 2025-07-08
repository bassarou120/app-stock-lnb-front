import { Component, ViewChild, OnInit } from '@angular/core';
import { ColumnMode, DatatableComponent, NgxDatatableModule } from '@siemens/ngx-datatable';
import { ArticleService } from '../../../core/services/articles/articles.service';
import { DashboardStockService } from '../../../core/services/dashboardStock/dashboardStock.service';
import { Categorie, Article, InterventionVehicule } from '../../../core/services/interface/models';
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
  templateUrl: 'visite-technique-avenir.component.html',

})
export class VisteTechniqueAVenir implements OnInit {

  // PROPRIÉTÉS POUR LA GESTION DES PERMISSIONS
  allowedFonctionnalites: string[] = [];
  canViewEtatStock: boolean = true;    // DÉFAUT À TRUE pour éviter les blocages
  canExportEtatStock: boolean = true; // DÉFAUT À TRUE pour éviter les blocages
  hasPageAccess: boolean = true;  //  DÉFAUT À TRUE pour éviter les blocages


  rows: InterventionVehicule[] = [];
  temp: Article[] = [];
  loadingIndicator = true;
  reorderable = true;
  ColumnMode = ColumnMode;
  categories: Categorie[] = []; // Liste des catégories d'articles
  selectedCategoryId: number | null = null;  // Ajoutez cette propriété
  nombre_interventions_recentes: number = 0;
  visitesTechniquesProches: InterventionVehicule[] = [];

  // STATISTIQUES
  totalVehicules: number = 0;
  vehiculesExpires: number = 0;
  vehiculesUrgents: number = 0;
  vehiculesAttention: number = 0;


  @ViewChild('table') table!: DatatableComponent;

  constructor(private dashboardStockService: DashboardStockService, private router: Router){}

  // Variable pour stocker le texte de recherche
  searchText: string = '';
  ngOnInit(): void {
    // 🔥 INITIALISER LES PERMISSIONS EN PREMIER
    this.initializePermissions();
    // Ensuite charger les données seulement si on a accès
    //if (this.hasPageAccess) {
      this.loadVisitesTechniquesProches();
    //}
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

  loadVisiteTechniqueProche(): void {
    this.dashboardStockService.getVisiteTechniqueSoon().subscribe(
      (data) => {
        this.visitesTechniquesProches = data;

        this.loadingIndicator = false;
      },
      (error) => {
        console.error('Erreur lors du chargement des assurances à terme:', error);
        this.loadingIndicator = false;
      }
    );
  }

  // Méthodes pour les actions
  voirDetails(row: any): void {
    console.log('Voir détails du véhicule:', row);
    // Logique pour afficher les détails
  }

  programmerVisite(row: any): void {
    console.log('Programmer nouvelle visite pour:', row);
    // Logique pour programmer une nouvelle visite
  }

  actionUrgente(row: any): void {
    console.log('Action urgente pour:', row);
    // Logique pour action urgente (notification, etc.)
  }

  // Propriété pour Math dans le template
  Math = Math;


  loadVisitesTechniquesProches(): void {
    this.loadingIndicator = true;

    this.dashboardStockService.getVisiteTechniqueSoon().subscribe({
      next: (data: InterventionVehicule[]) => {
        this.visitesTechniquesProches = data || [];
        this.rows = data || [];

        // Calculer les statistiques
        this.calculerStatistiques();

        this.loadingIndicator = false;
        console.log('Visites techniques chargées:', this.visitesTechniquesProches.length);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des visites techniques:', error);
        this.visitesTechniquesProches = [];
        this.rows = [];
        this.loadingIndicator = false;
      }
    });
  }

private calculerStatistiques(): void {
  this.totalVehicules = this.visitesTechniquesProches.length;

  this.vehiculesExpires = this.visitesTechniquesProches.filter(
    item => item.jours_restants < 0
  ).length;

  this.vehiculesUrgents = this.visitesTechniquesProches.filter(
    item => item.jours_restants >= 0 && item.jours_restants <= 15
  ).length;

  this.vehiculesAttention = this.visitesTechniquesProches.filter(
    item => item.jours_restants > 15 && item.jours_restants <= 45
  ).length;
}

    // MÉTHODE POUR DÉTERMINER LA CLASSE CSS DU BADGE
  getBadgeClass(joursRestants: number): string {
    if (joursRestants < 0) return 'bg-danger';
    if (joursRestants <= 15) return 'bg-warning text-dark';
    if (joursRestants <= 45) return 'bg-info';
    return 'bg-success';
  }

  // MÉTHODE POUR DÉTERMINER LE TEXTE DU STATUT
  getStatutText(joursRestants: number): string {
    if (joursRestants < 0) return 'Expiré';
    if (joursRestants <= 15) return 'Urgent';
    if (joursRestants <= 45) return 'Attention';
    return 'À jour';
  }

    // MÉTHODE POUR RAFRAÎCHIR LES DONNÉES
  rafraichir(): void {
    this.loadVisitesTechniquesProches();
  }

    // 🔥 NOUVELLE MÉTHODE : Définir les permissions par défaut
  private setDefaultPermissions(): void {
    this.canViewEtatStock = true;
    this.canExportEtatStock = true;
    this.hasPageAccess = true;
    console.log('✅ Permissions par défaut appliquées');
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
  //this.rows = filteredRows;
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


  }

  exportExcel() {

  }
}
