// src/app/core/services/rapport/stock/stock-rapport.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';

// Importe les interfaces nécessaires
import { MouvementStock, PaginatedResponse, TypeMouvement } from '../../interface/models';

// Définis une interface pour la réponse BackendPostResource de Laravel
export interface BackendPostResource<T> {
  success: boolean;
  message: string;
  data: T;
}

// NOUVELLE INTERFACE : Structure de la réponse paginée pour l'état de stock
// Le backend renverra probablement quelque chose comme { articles: [], pagination: {} }
export interface PaginatedEtatStockResponse<T> {
    articles: T[]; // Liste des articles avec leur état de stock
    // Vous pouvez ajouter d'autres propriétés de pagination si nécessaire ici,
    // comme total, current_page, last_page, etc., similaires à PaginatedResponse.
    // Pour l'instant, je vais les laisser non spécifiées, mais vous pouvez les typer si le backend les envoie
    // total?: number;
    // current_page?: number;
    // last_page?: number;
    // etc.
}


@Injectable({
  providedIn: 'root',
})
export class StockRapportService {
  private apiUrl = `${environment.backend}/rapports/stock`; // URL de base pour les mouvements de stock

  // NOUVELLE URL pour l'état de stock
  private etatStockApiUrl = `${environment.backend}/rapports/etat-stock`; 

  constructor(private http: HttpClient) {}

  // Ajoute une méthode handleError pour une gestion centralisée des erreurs
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: HttpErrorResponse): Observable<T> => {
      console.error(`ERROR: ${operation} failed:`, error);

      let errorMessage = `Erreur lors de l'opération ${operation}.`;
      if (error.error instanceof ErrorEvent) {
        errorMessage = `Erreur côté client: ${error.error.message}`;
      } else {
        if (error.status === 422 && error.error && typeof error.error === 'object') {
          // Si le backend renvoie des erreurs de validation structurées
          const validationErrors = Object.values(error.error).flat();
          errorMessage = `Erreur de validation: ${validationErrors.join(', ')}`;
        } else if (error.status === 404) {
          errorMessage = `Ressource non trouvée (code ${error.status}): ${error.message || JSON.stringify(error.error)}`;
        }
        else {
          errorMessage = `Erreur du serveur (code ${error.status}): ${error.message || JSON.stringify(error.error)}`;
        }
      }
      console.error(errorMessage);
      // Il est important de relancer une erreur Observable pour que le composant puisse la gérer
      return throwError(() => new Error(errorMessage));
    };
  }

  /**
   * Récupère les données du rapport de stock (mouvements: entrée/sortie) en fonction des filtres.
   * @param filters Les filtres à appliquer (id_type_rapport, date_debut, date_fin, etc.)
   */
  getRapportData(filters: { [key: string]: any }): Observable<BackendPostResource<PaginatedResponse<MouvementStock>>> {
    let params = new HttpParams();
    for (const key in filters) {
      if (filters.hasOwnProperty(key) && filters[key] !== null && filters[key] !== undefined && filters[key] !== '') {
        params = params.append(key, filters[key].toString());
      }
    }

    console.log('Requête GET pour les rapports de mouvement de stock vers:', this.apiUrl, 'avec params:', params.toString());
    return this.http.get<BackendPostResource<PaginatedResponse<MouvementStock>>>(this.apiUrl, { params: params }).pipe(
      tap(response => console.log('Réponse du service getRapportData:', response)),
      catchError(this.handleError<BackendPostResource<PaginatedResponse<MouvementStock>>>('getRapportDataStock'))
    );
  }

  /**
   * Récupère les données du rapport d'état de stock en fonction des filtres.
   * @param filters Les filtres à appliquer (id_Article, qte_min, qte_max, date_debut, date_fin)
   */
  getRapportEtatStockData(filters: { [key: string]: any }): Observable<BackendPostResource<PaginatedEtatStockResponse<any>>> {
    let params = new HttpParams();
    for (const key in filters) {
      // S'assurer que 'id_article' est en minuscule comme attendu par le backend pour ce rapport
      const paramKey = key === 'id_Article' ? 'id_article' : key; 
      if (filters.hasOwnProperty(key) && filters[key] !== null && filters[key] !== undefined && filters[key] !== '') {
        params = params.append(paramKey, filters[key].toString());
      }
    }

    console.log('Requête GET pour le rapport d\'état de stock vers:', this.etatStockApiUrl, 'avec params:', params.toString());
    return this.http.get<BackendPostResource<PaginatedEtatStockResponse<any>>>(this.etatStockApiUrl, { params: params }).pipe(
      tap(response => console.log('Réponse du service getRapportEtatStockData:', response)),
      catchError(this.handleError<BackendPostResource<PaginatedEtatStockResponse<any>>>('getRapportEtatStockData'))
    );
  }


  /**
   * Appelle l'API Laravel pour imprimer le rapport de stock (mouvements) filtré en PDF.
   * @param filters Les filtres à appliquer pour le rapport.
   */
  imprimerRapportData(filters: { [key: string]: any }): Observable<Blob> {
    let params = new HttpParams();
    for (const key in filters) {
      if (filters.hasOwnProperty(key) && filters[key] !== null && filters[key] !== undefined && filters[key] !== '') {
        params = params.append(key, filters[key].toString());
      }
    }
    const printUrl = `${environment.backend}/rapports/stock/imprimer`;
    console.log('Requête PDF pour les rapports de mouvement de stock vers:', printUrl, 'avec params:', params.toString());
    return this.http.get(printUrl, { responseType: 'blob', params: params }).pipe(
      tap(() => console.log('PDF du rapport de mouvement de stock reçu.')),
      catchError(this.handleError<Blob>('imprimerRapportStock'))
    );
  }

  /**
   * Appelle l'API Laravel pour imprimer le rapport d'état de stock filtré en PDF.
   * @param filters Les filtres à appliquer pour le rapport.
   */
  imprimerRapportEtatStock(filters: { [key: string]: any }): Observable<Blob> {
    let params = new HttpParams();
    for (const key in filters) {
      // S'assurer que 'id_article' est en minuscule comme attendu par le backend pour ce rapport
      const paramKey = key === 'id_Article' ? 'id_article' : key; 
      if (filters.hasOwnProperty(key) && filters[key] !== null && filters[key] !== undefined && filters[key] !== '') {
        params = params.append(paramKey, filters[key].toString());
      }
    }
    const printUrl = `${environment.backend}/rapports/etat-stock/imprimer`; // NOUVEL ENDPOINT PDF
    console.log('Requête PDF pour le rapport d\'état de stock vers:', printUrl, 'avec params:', params.toString());
    return this.http.get(printUrl, { responseType: 'blob', params: params }).pipe(
      tap(() => console.log('PDF du rapport d\'état de stock reçu.')),
      catchError(this.handleError<Blob>('imprimerRapportEtatStock'))
    );
  }
}
