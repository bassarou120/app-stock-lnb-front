// src/app/core/services/rapport/immobilisation-rapport.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

// Importe les interfaces nécessaires
import { Immobilisation, PaginatedResponse, BackendPostResource, Transfert } from '../interface/models';

@Injectable({
  providedIn: 'root'
})
export class ImmobilisationRapportService {
  private apiUrl = `${environment.backend}`; // L'URL de base du backend

  constructor(private http: HttpClient) { }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: HttpErrorResponse): Observable<T> => {
      console.error(`ERROR: ${operation} failed:`, error);

      let errorMessage = `Erreur lors de l'opération ${operation}.`;
      if (error.error instanceof ErrorEvent) {
        errorMessage = `Erreur côté client: ${error.error.message}`;
      } else {
        if (error.status === 422 && error.error && typeof error.error === 'object') {
          // Laravel validation errors are often nested in 'errors' object if present
          const validationErrors = Object.values(error.error.errors || error.error).flat(); // Check for 'errors' key first
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
   * Récupère les données du rapport (immobilisations ou transferts) en fonction des filtres.
   * @param filters Un objet contenant les critères de filtrage, y compris 'id_type_rapport'.
   */
  getRapportData(filters: { [key: string]: any }): Observable<BackendPostResource<PaginatedResponse<Immobilisation | Transfert>>> {
    let endpoint = '';
    let params = new HttpParams();

    // Déterminer l'endpoint et construire les paramètres en fonction du type de rapport
    switch (filters['id_type_rapport']) {
      case 'enregistrement':
        endpoint = `${this.apiUrl}/rapports/immobilisations`;
        if (filters['code_immo']) {
          params = params.set('code_immo', filters['code_immo']);
        }
        if (filters['date_debut_acquisition']) {
          params = params.set('date_debut_acquisition', filters['date_debut_acquisition']);
        }
        break;
      case 'transfert':
        endpoint = `${this.apiUrl}/rapports/transferts`; // NOUVEL ENDPOINT POUR LES TRANSFERTS
        if (filters['date_debut']) { // Ces noms de paramètres doivent correspondre à votre backend Laravel
          params = params.set('date_debut', filters['date_debut']);
        }
        if (filters['date_fin']) {
          params = params.set('date_fin', filters['date_fin']);
        }
        if (filters['old_bureau_id']) {
          params = params.set('old_bureau_id', filters['old_bureau_id']);
        }
        if (filters['bureau_id']) {
          params = params.set('bureau_id', filters['bureau_id']);
        }
        if (filters['old_employe_id']) {
          params = params.set('old_employe_id', filters['old_employe_id']);
        }
        if (filters['employe_id']) {
          params = params.set('employe_id', filters['employe_id']);
        }
        break;
      default:
        return throwError(() => new Error('Type de rapport non valide.'));
    }

    // Ajouter l'id_type_rapport à tous les appels pour que le backend puisse différencier
    params = params.set('id_type_rapport', filters['id_type_rapport']);

    console.log(`Requête GET vers: ${endpoint} avec params:`, params.toString());
    return this.http.get<BackendPostResource<PaginatedResponse<Immobilisation | Transfert>>>(endpoint, { params: params }).pipe(
      catchError(this.handleError<BackendPostResource<PaginatedResponse<Immobilisation | Transfert>>>('getRapportData'))
    );
  }

  /**
   * Génère le PDF du rapport (immobilisations ou transferts) en fonction des filtres.
   * @param filters Un objet contenant les critères de filtrage, y compris 'id_type_rapport'.
   */
  imprimerRapportData(filters: { [key: string]: any }): Observable<Blob> {
    let endpoint = '';
    let params = new HttpParams();

    // Déterminer l'endpoint et construire les paramètres en fonction du type de rapport
    switch (filters['id_type_rapport']) {
      case 'enregistrement':
        endpoint = `${this.apiUrl}/rapports/immobilisations/imprimer`;
        if (filters['code_immo']) {
          params = params.set('code_immo', filters['code_immo']);
        }
        if (filters['date_debut_acquisition']) {
          params = params.set('date_debut_acquisition', filters['date_debut_acquisition']);
        }
        break;
      case 'transfert':
        endpoint = `${this.apiUrl}/rapports/transferts/imprimer`; // NOUVEL ENDPOINT PDF POUR LES TRANSFERTS
        if (filters['date_debut']) {
          params = params.set('date_debut', filters['date_debut']);
        }
        if (filters['date_fin']) {
          params = params.set('date_fin', filters['date_fin']);
        }
        if (filters['old_bureau_id']) {
          params = params.set('old_bureau_id', filters['old_bureau_id']);
        }
        if (filters['bureau_id']) {
          params = params.set('bureau_id', filters['bureau_id']);
        }
        if (filters['old_employe_id']) {
          params = params.set('old_employe_id', filters['old_employe_id']);
        }
        if (filters['employe_id']) {
          params = params.set('employe_id', filters['employe_id']);
        }
        break;
      default:
        return throwError(() => new Error('Type de rapport non valide pour l\'impression.'));
    }

    // Ajouter l'id_type_rapport à tous les appels pour que le backend puisse différencier
    params = params.set('id_type_rapport', filters['id_type_rapport']);

    console.log(`Requête PDF vers: ${endpoint} avec params:`, params.toString());
    return this.http.get(endpoint, { params: params, responseType: 'blob' }).pipe(
      tap(() => console.log('PDF du rapport reçu.')),
      catchError(this.handleError<Blob>('imprimerRapportData'))
    );
  }
}
