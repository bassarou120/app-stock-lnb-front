import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from "../../../../environments/environment";
import { Immobilisation, Fournisseur, StatusImmo, SousTypeImmo, GroupeTypeImmo, Vehicule, TypeIntervention, Bureau, Employe } from "../interface/models";
import { catchError, map, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class ImmobilisationsService {
  private url: string = environment.backend;
  private apiUrl = `${environment.backend}/type-interventions`;

  constructor(private http: HttpClient) { }

  getAllImmobilisations(): Observable<Immobilisation[]> {
    return this.http.get<{ success: boolean; message: string; data: { data: Immobilisation[] } }>(
      `${this.url}/immobilisations`
    ).pipe(
      map((response: { success: boolean; message: string; data: { data: Immobilisation[] } }) =>
        response.data.data // On récupère uniquement le tableau de Immobilisation
      )
    );
  }

  saveImmobilisation(data: Immobilisation): Observable<Immobilisation> {
    return this.http.post<Immobilisation>(`${this.url}/immobilisations`, data);
  }

  editImmobilisation(data: Immobilisation): Observable<Immobilisation> {
    return this.http.put<Immobilisation>(`${this.url}/immobilisations/${data.id}`, data);
  }

  deleteImmobilisation(data: Immobilisation): Observable<void> {
    return this.http.delete<void>(`${this.url}/immobilisations/${data.id}`);
  }

  getAllFournisseurs(): Observable<Fournisseur[]> {
    return this.http.get<{ success: boolean; message: string; data: { data: Fournisseur[] } }>(
      `${this.url}/fournisseurs`
    ).pipe(
      map((response: { success: boolean; message: string; data: { data: Fournisseur[] } }) =>
        response.data.data // On récupère uniquement le tableau de fournisseurs
      )
    );
  }

  getAllEmployes(): Observable<Employe[]> {
    return this.http.get<{ success: boolean; message: string; data: { data: Employe[] } }>(
      `${this.url}/employes`
    ).pipe(
      map((response: { success: boolean; message: string; data: { data: Employe[] } }) =>
        response.data.data // On récupère uniquement le tableau de Employe
      )
    );
  }

  getAllBureaux(): Observable<Bureau[]> {
    return this.http.get<{ success: boolean; message: string; data: { data: Bureau[] } }>(
      `${this.url}/bureaux`
    ).pipe(
      map((response: { success: boolean; message: string; data: { data: Bureau[] } }) =>
        response.data.data // On récupère uniquement le tableau de Bureau
      )
    );
  }

  getAllStatusImmos(): Observable<StatusImmo[]> {
    return this.http.get<{ success: boolean; message: string; data: { data: StatusImmo[] } }>(
      `${this.url}/status_immos`
    ).pipe(
      map((response: { success: boolean; message: string; data: { data: StatusImmo[] } }) =>
        response.data.data // On récupère uniquement le tableau de StatusImmo
      )
    );
  }

  getAllSousTypeImmos(): Observable<SousTypeImmo[]> {
    return this.http.get<{ success: boolean; message: string; data: { data: SousTypeImmo[] } }>(
      `${this.url}/sous_type_immos`
    ).pipe(
      map((response: { success: boolean; message: string; data: { data: SousTypeImmo[] } }) =>
        response.data.data // On récupère uniquement le tableau de SousTypeImmo
      )
    );
  }

  getAllGroupeTypeImmos(): Observable<GroupeTypeImmo[]> {
    return this.http.get<{ success: boolean; message: string; data: { data: GroupeTypeImmo[] } }>(
      `${this.url}/groupe_type_immos`
    ).pipe(
      map((response: { success: boolean; message: string; data: { data: GroupeTypeImmo[] } }) =>
        response.data.data // On récupère uniquement le tableau de groupe_type_immos
      )
    );
  }

  getAllVehicules(): Observable<Vehicule[]> {
    return this.http.get<{ success: boolean; message: string; data: { data: Vehicule[] } }>(
      `${this.url}/vehicules`
    ).pipe(
      map((response: { success: boolean; message: string; data: { data: Vehicule[] } }) =>
        response.data.data // On récupère uniquement le tableau de Article
      )
    );
  }

  importImmobilisations(formData: FormData): Observable<any> {
    // L'URL complète de l'endpoint d'importation
    return this.http.post(`${this.url}/immobilisations/import`, formData);
  }

  // getAllTypeInterventions(): Observable<TypeIntervention[]> {
  //   return this.http.get<any>(this.apiUrl).pipe( // Assurez-vous que votre API retourne une PostResource ou PaginatedResponse
  //     map(response => response.data.data), // Adaptez si la structure de réponse est différente
  //     catchError(this.handleError<TypeIntervention[]>('getAllTypeInterventions', []))
  //   );
  // }

  imprimerImmos(): Observable<Blob> {
    const printUrl = `${environment.backend}/immobilisations/imprimer`; // L'URL de ton endpoint Laravel pour l'impression
    console.log('Requête PDF pour les immobilisations vers:', printUrl);
    return this.http.get(printUrl, { responseType: 'blob' }).pipe(
      tap(() => console.log('PDF des immobilisations reçu.')),
      catchError(this.handleError<Blob>('imprimerImmos'))
    );
  }
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: HttpErrorResponse): Observable<T> => {
      console.error(`${operation} failed:`, error);
      // Retourne un résultat vide ou par défaut pour que l'application continue de fonctionner
      return of(result as T);
    };
  }
}
