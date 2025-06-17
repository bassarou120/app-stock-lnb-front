// src/app/core/services/rapport/stock-rapport.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';

// Importe les interfaces nécessaires
import { MouvementStock, PaginatedResponse, TypeMouvement } from '../../interface/models';

// Définis une interface pour la réponse PostResource de Laravel
export interface BackendPostResource<T> {
  success: boolean;
  message: string;
  data: T;
}

@Injectable({
  providedIn: 'root',
})
export class StockRapportService {
  private apiUrl = `${environment.backend}/rapports/stock`; // Assure-toi que c'est la bonne URL de base

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
          const validationErrors = Object.values(error.error).flat();
          errorMessage = `Erreur de validation: ${validationErrors.join(', ')}`;
        } else {
          errorMessage = `Erreur du serveur (code ${error.status}): ${error.message || JSON.stringify(error.error)}`;
        }
      }
      console.error(errorMessage);
      return throwError(() => new Error(errorMessage));
    };
  }

  /**
   * Récupère les données du rapport de stock en fonction des filtres.
   * @param filters Les filtres à appliquer (id_type_rapport, date_debut, date_fin, etc.)
   */
  getRapportData(filters: { [key: string]: any }): Observable<BackendPostResource<PaginatedResponse<MouvementStock>>> {
    let params = new HttpParams();
    for (const key in filters) {
      if (filters.hasOwnProperty(key) && filters[key] !== null && filters[key] !== undefined) {
        params = params.append(key, filters[key].toString());
      }
    }

    // L'endpoint est `/rapports/stock` et la méthode est GET, donc les filtres sont des query params
    return this.http.get<BackendPostResource<PaginatedResponse<MouvementStock>>>(this.apiUrl, { params: params }).pipe(
      tap(response => console.log('Réponse du service getRapportData:', response)),
      catchError(this.handleError<BackendPostResource<PaginatedResponse<MouvementStock>>>('getRapportDataStock'))
    );
  }

  /**
   * Appelle l'API Laravel pour imprimer le rapport de stock filtré en PDF.
   * @param filters Les filtres à appliquer pour le rapport.
   */
  imprimerRapportData(filters: { [key: string]: any }): Observable<Blob> {
    let params = new HttpParams();
    for (const key in filters) {
      if (filters.hasOwnProperty(key) && filters[key] !== null && filters[key] !== undefined) {
        params = params.append(key, filters[key].toString());
      }
    }
    const printUrl = `${environment.backend}/rapports/stock/imprimer`;
    console.log('Requête PDF pour les rapports de stock vers:', printUrl, 'avec params:', params.toString());
    return this.http.get(printUrl, { responseType: 'blob', params: params }).pipe(
      tap(() => console.log('PDF du rapport de stock reçu.')),
      catchError(this.handleError<Blob>('imprimerRapportStock'))
    );
  }
}
