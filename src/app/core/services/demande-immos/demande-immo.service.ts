import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from "../../../../environments/environment";

// Importe tes modèles ici (à adapter selon ton fichier interface/models)
import { Bureau, Employe, Immobilisation } from "../interface/models";

@Injectable({
  providedIn: 'root',
})
export class DemandeImmoService {
  private url: string = environment.backend;

  constructor(private http: HttpClient) {}

  /**
   * Récupère la liste des demandes d'immo (avec mapping data.data pour la pagination Laravel)
   */
  getAllDemandesImmo(): Observable<any[]> {
    return this.http.get<{ success: boolean; message: string; data: { data: any[] } }>(
      `${this.url}/demande-immo`
    ).pipe(
      map(response => response.data.data),
      catchError(this.handleError<any[]>('getAllDemandesImmo', []))
    );
  }

  /**
   * Créer une demande
   */
  saveDemandeImmo(data: any): Observable<any> {
    return this.http.post<any>(`${this.url}/demande-immo`, data);
  }

  /**
   * Changer le statut (Validation, Rejet ou Clôture avec fichier)
   * Utilise FormData pour supporter l'upload du fichier en clôture
   */
  changerStatusDemande(id: number, formData: FormData): Observable<any> {
    return this.http.post<any>(`${this.url}/demande-immo/${id}/change-status`, formData);
  }

  /**
   * Récupérer les données pour les formulaires (Bureaux, Employés, Immos)
   */
  getAllBureaux(): Observable<Bureau[]> {
    return this.http.get<{ data: { data: Bureau[] } }>(`${this.url}/bureaux`).pipe(
      map(res => res.data.data)
    );
  }

  getAllEmployes(): Observable<Employe[]> {
    return this.http.get<{ data: { data: Employe[] } }>(`${this.url}/employes`).pipe(
      map(res => res.data.data)
    );
  }

  // Pour choisir l'immo physique lors de la validation
  getAllImmobilisations(): Observable<Immobilisation[]> {
    return this.http.get<{ data: { data: Immobilisation[] } }>(`${this.url}/immobilisations`).pipe(
      map(res => res.data.data)
    );
  }

  /**
   * Suppression logique
   */
  deleteDemandeImmo(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/demande-immo/${id}`);
  }

  // Dans demande-immo.service.ts
  getBonSortieUrl(idDemande: number): string {
    // On utilise l'URL exacte définie dans votre fichier routes/api.php
    return `${this.url}/demande-immo/fiche/${idDemande}`;
  }

  getFicheDemande(id: number): Observable<Blob> {
    return this.http.get(`${this.url}/demande-immo/fiche/${id}`, {
      responseType: 'blob' // Très important pour les PDF
    });
  }
  
  /**
   * Gestion des erreurs identique à ton service MouvementStock
   */
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: HttpErrorResponse): Observable<T> => {
      console.error(`${operation} failed:`, error);
      return of(result as T);
    };
  }
}