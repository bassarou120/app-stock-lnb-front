import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs'; // Ajout de throwError pour la gestion des erreurs
import { HttpClient, HttpErrorResponse } from '@angular/common/http'; // Ajout de HttpErrorResponse
import { environment } from "../../../../environments/environment";
import { TypeIntervention, BackendPostResource } from "../interface/models"; // Import de BackendPostResource
import { map, catchError } from 'rxjs/operators'; // Ajout de catchError

@Injectable({
  providedIn: 'root',
})
export class TypeInterventionService {
  private url: string = environment.backend; // Utilisation de votre structure d'URL existante

  constructor(private http: HttpClient) {}

  // Nouvelle méthode pour gérer les erreurs HTTP de manière centralisée
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: HttpErrorResponse): Observable<T> => {
      console.error(`ERROR: ${operation} failed:`, error); // Log l'erreur complète
      let errorMessage = `Erreur lors de l'opération ${operation}.`;

      if (error.error instanceof ErrorEvent) {
        // Erreur côté client ou réseau
        errorMessage = `Erreur côté client: ${error.error.message}`;
      } else if (error.status === 422 && error.error && typeof error.error === 'object') {
        // Erreurs de validation Laravel (statut 422)
        const validationErrors = Object.values(error.error).flat();
        errorMessage = `Erreur de validation: ${validationErrors.join(', ')}`;
      } else {
        // Erreur côté serveur (non-validation ou autre)
        errorMessage = `Erreur du serveur (code ${error.status}): ${error.message || JSON.stringify(error.error)}`;
      }
      console.error(errorMessage); // Log le message d'erreur simplifié
      return throwError(() => new Error(errorMessage)); // Retourne un Observable d'erreur
    };
  }

  getAllTypeInterventions(): Observable<TypeIntervention[]> {
    // La structure de la réponse backend est : { success, message, data: { data: TypeIntervention[] } }
    return this.http.get<{ success: boolean; message: string; data: { data: TypeIntervention[] } }>(
      `${this.url}/type-interventions`
    ).pipe(
      map((response: { success: boolean; message: string; data: { data: TypeIntervention[] } }) => 
        response.data.data // On récupère uniquement le tableau de TypeIntervention
      ),
      catchError(this.handleError<TypeIntervention[]>('getAllTypeInterventions', [])) // Ajout de la gestion d'erreur
    ); 
  }

  saveTypeIntervention(typeIntervention: Partial<TypeIntervention>): Observable<TypeIntervention> {
    // Construction explicite du payload pour s'assurer que seuls les champs pertinents sont envoyés.
    // 'date_expiration' est complètement omis.
    const payload = {
      libelle_type_intervention: typeIntervention.libelle_type_intervention,
      applicable_seul_vehicule: typeIntervention.applicable_seul_vehicule,
      observation: typeIntervention.observation,
      has_expiration_date: typeIntervention.has_expiration_date // Envoi du booléen has_expiration_date
    };
    return this.http.post<BackendPostResource<TypeIntervention>>(`${this.url}/type-interventions`, payload).pipe(
      map(response => response.data), // Extrait les données de la réponse BackendPostResource
      catchError(this.handleError<TypeIntervention>('saveTypeIntervention')) // Ajout de la gestion d'erreur
    );
  }

  editTypeIntervention(typeIntervention: Partial<TypeIntervention>): Observable<TypeIntervention> {
    // Construction explicite du payload pour l'édition.
    // 'date_expiration' est complètement omis.
    const payload = {
      id: typeIntervention.id, // L'ID est essentiel pour l'édition
      libelle_type_intervention: typeIntervention.libelle_type_intervention,
      applicable_seul_vehicule: typeIntervention.applicable_seul_vehicule,
      observation: typeIntervention.observation,
      has_expiration_date: typeIntervention.has_expiration_date // Envoi du booléen has_expiration_date
    };
    return this.http.put<BackendPostResource<TypeIntervention>>(`${this.url}/type-interventions/${typeIntervention.id}`, payload).pipe(
      map(response => response.data), // Extrait les données de la réponse BackendPostResource
      catchError(this.handleError<TypeIntervention>('editTypeIntervention')) // Ajout de la gestion d'erreur
    );
  }

  deleteTypeIntervention(typeIntervention: Partial<TypeIntervention>): Observable<void> {
    return this.http.delete<BackendPostResource<void>>(`${this.url}/type-interventions/${typeIntervention.id}`).pipe(
      map(response => response.data), // La réponse pour une suppression peut être vide ou un message
      catchError(this.handleError<void>('deleteTypeIntervention')) // Ajout de la gestion d'erreur
    );
  }
}
