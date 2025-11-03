// src/app/core/services/rapport/immobilisation-rapport.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

// Importe les interfaces nécessaires
import { Immobilisation, PaginatedResponse, BackendPostResource, Transfert, Intervention, CodeAsset } from '../interface/models';

interface CodesApiResponse {
  success: boolean;
  message: string;
  data: {
    codes: CodeAsset[]; 
  };
}

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
          const validationErrors = Object.values(error.error.errors || error.error).flat();
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
   * Récupère les données du rapport (immobilisations, transferts ou interventions) en fonction des filtres.
   * @param filters Un objet contenant les critères de filtrage, y compris 'id_type_rapport'.
   */
  getRapportData(filters: { [key: string]: any }): Observable<BackendPostResource<PaginatedResponse<Immobilisation | Transfert | Intervention>>> {
    let endpoint = '';
    let params = new HttpParams();

    const reportType = filters['id_type_rapport'];

    console.log("Service: getRapportData called with filters:", filters);
    console.log("Service: reportType for data:", reportType);

    if (!reportType) {
        return throwError(() => new Error('Type de rapport est manquant ou non défini pour l\'affichage des données.'));
    }

    switch (reportType) {
      case 'enregistrement':
        endpoint = `${this.apiUrl}/rapports/immobilisations`;
        if (filters['code_immo']) {
          params = params.set('code_immo', filters['code_immo']);
        }
        if (filters['date_debut_acquisition']) { // Ce champ est spécifique à ce rapport
          params = params.set('date_debut_acquisition', filters['date_debut_acquisition']);
        }
        break;
      case 'transfert':
        endpoint = `${this.apiUrl}/rapports/transferts`;
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
      case 'intervention':
        endpoint = `${this.apiUrl}/rapports/interventions`;
        if (filters['date_debut']) {
          params = params.set('date_debut', filters['date_debut']);
        }
        if (filters['date_fin']) {
          params = params.set('date_fin', filters['date_fin']);
        }
        if (filters['type_intervention_id']) {
          params = params.set('type_intervention_id', filters['type_intervention_id']);
        }
        if (filters['immo_id']) {
          params = params.set('immo_id', filters['immo_id']);
        }
        break;
      case 'inventaire': // <-- NOUVEAU: Ajout du case pour 'inventaire'
        endpoint = `${this.apiUrl}/rapports/inventaire`; // Endpoint pour l'inventaire
        if (filters['date_debut']) { // Ces dates correspondent aux dates d'acquisition pour l'inventaire
          params = params.set('date_debut_acquisition', filters['date_debut']);
        }
        if (filters['date_fin']) {
          params = params.set('date_fin_acquisition', filters['date_fin']);
        }
        // Pas d'autres filtres spécifiques ici selon notre discussion
        break;

      case 'bureau':
        endpoint = `${this.apiUrl}/rapports/parBureau`;
        // Modifie les noms des paramètres envoyés pour correspondre au backend
        if (filters['date_debut_bureau']) {
          params = params.set('date_debut_bureau', filters['date_debut_bureau']);
        }
        if (filters['date_fin_bureau']) {
          params = params.set('date_fin_bureau', filters['date_fin_bureau']);
        }
        if (filters['bureau_id']) {
          params = params.set('bureau_id', filters['bureau_id']);
        }
        break;

      default:
        return throwError(() => new Error(`Type de rapport non valide pour l\'affichage des données: '${reportType}'.`));
    }

    // Le paramètre id_type_rapport est toujours ajouté, mais il est déjà extrait
    // et utilisé dans le switch, donc pas besoin de le remettre dans params s'il est déjà géré par l'endpoint.
    // Cependant, le backend peut en avoir besoin pour sa propre logique de routage/dispatch.
    params = params.set('id_type_rapport', reportType);

    console.log(`Requête GET vers: ${endpoint} avec params:`, params.toString());
    return this.http.get<BackendPostResource<PaginatedResponse<Immobilisation | Transfert | Intervention>>>(endpoint, { params: params }).pipe(
      catchError(this.handleError<BackendPostResource<PaginatedResponse<Immobilisation | Transfert | Intervention>>>('getRapportData'))
    );
  }

  /**
   * Génère le PDF du rapport (immobilisations, transferts ou interventions) en fonction des filtres.
   * @param filters Un objet contenant les critères de filtrage, y compris 'id_type_rapport'.
   */
  imprimerRapportData(filters: { [key: string]: any }): Observable<Blob> {
    console.log("Service: imprimerRapportData called with filters:", filters);
    let endpoint = '';
    let params = new HttpParams();

    const reportType = filters['id_type_rapport'];

    console.log("Service: reportType for PDF:", reportType);

    if (!reportType) {
        return throwError(() => new Error('Type de rapport est manquant ou non défini pour l\'impression.'));
    }

    switch (reportType) {
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
        endpoint = `${this.apiUrl}/rapports/transferts/imprimer`;
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
      case 'intervention':
        endpoint = `${this.apiUrl}/rapports/interventions/imprimer`;
        if (filters['date_debut']) {
          params = params.set('date_debut', filters['date_debut']);
        }
        if (filters['date_fin']) {
          params = params.set('date_fin', filters['date_fin']);
        }
        if (filters['type_intervention_id']) {
          params = params.set('type_intervention_id', filters['type_intervention_id']);
        }
        if (filters['immo_id']) {
          params = params.set('immo_id', filters['immo_id']);
        }
        break;
      case 'inventaire': // <-- NOUVEAU: Ajout du case pour 'inventaire' pour l'impression PDF
        endpoint = `${this.apiUrl}/rapports/inventaire/imprimer`; // Endpoint pour l'impression PDF de l'inventaire
        if (filters['date_debut']) { // Ces dates correspondent aux dates d'acquisition pour l'inventaire
          params = params.set('date_debut_acquisition', filters['date_debut']);
        }
        if (filters['date_fin']) {
          params = params.set('date_fin_acquisition', filters['date_fin']);
        }
        break;

      case 'bureau': // ⬅️ AJOUTEZ CE CAS
        endpoint = `${this.apiUrl}/rapports/bureau/imprimer`; // Définir un nouvel endpoint si nécessaire

        if (filters['date_debut']) {
          params = params.set('date_debut_bureau', filters['date_debut']); // Nom du paramètre attendu par Laravel
        }
        if (filters['date_fin']) {
          params = params.set('date_fin_bureau', filters['date_fin']); // Nom du paramètre attendu par Laravel
        }
        if (filters['bureau_id']) {
          params = params.set('bureau_id', filters['bureau_id']);
        }
        break;


      default:
        return throwError(() => new Error(`Type de rapport non valide pour l\'impression: '${reportType}'.`));
    }

    params = params.set('id_type_rapport', reportType);

    console.log(`Requête PDF vers: ${endpoint} avec params:`, params.toString());
    return this.http.get(endpoint, { params: params, responseType: 'blob' }).pipe(
      tap(() => console.log('PDF du rapport reçu.')),
      catchError(this.handleError<Blob>('imprimerRapportData'))
    );
  }

  getAllInterventions_immos(): Observable<Intervention[]> {
    return this.http.get<{ success: boolean; message: string; data: { data: Intervention[] } }>(
      `${this.apiUrl}/intervention_immo`
    ).pipe(
      map((response: { success: boolean; message: string; data: { data: Intervention[] } }) =>
        response.data.data // On récupère uniquement le tableau de TypeIntervention
      )
    );
  }

// Dans votre service (ex: rapport.service.ts)

getAllCode_vehiculeImmo(): Observable<CodeAsset[]> { 
    
    return this.http.get<CodesApiResponse>(
      `${this.apiUrl}/rapports/getcodes` // Assurez-vous que l'URL est correcte
    ).pipe(
      map(response => {
        // CORRECTION DÉFINITIVE : Utiliser '?? []' pour garantir un tableau vide
        // Si response.data est undefined OU si response.data.codes est undefined,
        // cette expression retourne un tableau vide []
        return response.data?.codes ?? []; 
      })
    );
}
  


}
