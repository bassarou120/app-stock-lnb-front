// src/app/core/services/rapport/immobilisation-rapport.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { Immobilisation, PaginatedResponse } from '../interface/models'; // Assurez-vous d'importer PaginatedResponse ici

// Interface pour la structure de réponse Laravel PostResource
export interface BackendPostResource<T> { // Exporté pour être utilisé dans le composant
  success: boolean;
  message: string;
  data: T; // Le type de 'data' dépend du contenu
}

@Injectable({
  providedIn: 'root'
})
export class ImmobilisationRapportService {
  // Ajuste l'URL de base si nécessaire, basé sur tes routes Laravel
  private apiUrl = `${environment.backend}/rapports/immobilisations`;

  constructor(private http: HttpClient) { }

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
   * Récupère les immobilisations filtrées pour le rapport.
   * Retourne la structure complète BackendPostResource<PaginatedResponse<Immobilisation>>.
   */
  getImmobilisationsForReport(filters: any): Observable<BackendPostResource<PaginatedResponse<Immobilisation>>> {
    return this.http.get<BackendPostResource<PaginatedResponse<Immobilisation>>>(this.apiUrl, { params: filters }).pipe(
      catchError(this.handleError<BackendPostResource<PaginatedResponse<Immobilisation>>>('getImmobilisationsForReport'))
    );
  }

  /**
   * Demande au backend de générer un PDF du rapport d'immobilisations.
   */
  imprimerRapportImmos(filters: any): Observable<Blob> {
    const printUrl = `${environment.backend}/rapports/immobilisations/imprimer`; // Assure-toi que cette route correspond à ton backend

    // On s'attend à un Blob directement, pas besoin de PostResource wrapper ici si le backend envoie directement le PDF
    return this.http.get(printUrl, { params: filters, responseType: 'blob' }).pipe(
      tap(() => console.log('Demande de PDF envoyée.')),
      catchError(this.handleError<Blob>('imprimerRapportImmos'))
    );
  }
}
