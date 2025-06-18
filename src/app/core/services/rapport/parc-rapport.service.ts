// src/app/core/services/rapport/parc-rapport.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

import { Vehicule, InterventionVehicule, PaginatedResponse } from '../interface/models';

export interface BackendPostResource<T> {
  success: boolean;
  message: string;
  data: T;
}

@Injectable({
  providedIn: 'root',
})
export class ParcRapportService {
  private apiUrl = `${environment.backend}/rapports/parc`;

  constructor(private http: HttpClient) {}

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
   * Récupère les données de rapport pour les véhicules ou les interventions sur véhicules.
   * @param filters Les filtres à appliquer (id_type_rapport, dates, IDs spécifiques).
   */
  getRapportData(filters: { [key: string]: any }): Observable<BackendPostResource<PaginatedResponse<Vehicule | InterventionVehicule>>> {
    let params = new HttpParams();
    for (const key in filters) {
      if (filters.hasOwnProperty(key) && filters[key] !== null && filters[key] !== undefined) {
        params = params.append(key, filters[key].toString());
      }
    }

    // Le backend utilise GET avec des query parameters
    return this.http.get<BackendPostResource<PaginatedResponse<Vehicule | InterventionVehicule>>>(this.apiUrl, { params: params }).pipe(
      tap(response => console.log('Réponse du service getRapportData Parc:', response)),
      catchError(this.handleError<BackendPostResource<PaginatedResponse<Vehicule | InterventionVehicule>>>('getRapportDataParc'))
    );
  }

  /**
   * Appelle l'API Laravel pour imprimer le rapport de parc filtré en PDF.
   * @param filters Les filtres à appliquer pour le rapport.
   */
  imprimerRapportData(filters: { [key: string]: any }): Observable<Blob> {
    let params = new HttpParams();
    for (const key in filters) {
      if (filters.hasOwnProperty(key) && filters[key] !== null && filters[key] !== undefined) {
        params = params.append(key, filters[key].toString());
      }
    }
    const printUrl = `${environment.backend}/rapports/parc/imprimer`;
    console.log('Requête PDF pour les rapports de parc vers:', printUrl, 'avec params:', params.toString());
    return this.http.get(printUrl, { responseType: 'blob', params: params }).pipe(
      tap(() => console.log('PDF du rapport de parc reçu.')),
      catchError(this.handleError<Blob>('imprimerRapportParc'))
    );
  }
}
