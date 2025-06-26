import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PermissionService {

  constructor() { }

  /**
   * Récupère les fonctionnalités autorisées depuis le localStorage
   */
  getAllowedFonctionnalites(): string[] {
    try {
      const allowedFonctionnalitesStr = localStorage.getItem('allowedFonctionnalites');
      return allowedFonctionnalitesStr ? JSON.parse(allowedFonctionnalitesStr) : [];
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des fonctionnalités:', error);
      return [];
    }
  }

  /**
   * Vérifie si une fonctionnalité spécifique est autorisée
   */
  hasPermission(fonctionnalite: string): boolean {
    const allowedFonctionnalites = this.getAllowedFonctionnalites();
    return allowedFonctionnalites.includes(fonctionnalite);
  }

  /**
   * Vérifie si l'utilisateur a accès au module de gestion de stock
   */
  hasStockAccess(): boolean {
    const allowedFonctionnalites = this.getAllowedFonctionnalites();
    return allowedFonctionnalites.some(fonct =>
      fonct.includes('Stock') ||
      fonct.includes('Ajout du Stock') ||
      fonct.includes('Modification du Stock') ||
      fonct.includes('Suppression du Stock')
    );
  }

  /**
   * Récupère toutes les permissions liées au stock
   */
  getStockPermissions(): {
    canView: boolean;
    canAdd: boolean;
    canModify: boolean;
    canDelete: boolean;
    canExport: boolean;
  } {
    const allowedFonctionnalites = this.getAllowedFonctionnalites();

    return {
      canView: this.hasStockAccess(),
      canAdd: allowedFonctionnalites.includes('Ajout du Stock'),
      canModify: allowedFonctionnalites.includes('Modification du Stock'),
      canDelete: allowedFonctionnalites.includes('Suppression du Stock'),
      canExport: allowedFonctionnalites.includes('Export Stock')
    };
  }
}
