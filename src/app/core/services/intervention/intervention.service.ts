import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from "../../../../environments/environment";
import { Immobilisation, TypeIntervention, Intervention } from "../interface/models";
import { catchError, map, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class InterventionsService {
  private url: string = environment.backend;

  constructor(private http: HttpClient) { }

  getAllInterventions(): Observable<Intervention[]> {
    return this.http.get<{ success: boolean; message: string; data: { data: Intervention[] } }>(
      `${this.url}/interventions`
    ).pipe(
      map((response: { success: boolean; message: string; data: { data: Intervention[] } }) =>
        response.data.data // On récupère uniquement le tableau des Interventions
      )
    );
  }

  saveIntervention(data: Intervention): Observable<Intervention> {
    return this.http.post<Intervention>(`${this.url}/interventions`, data);
  }

  editIntervention(data: Intervention): Observable<Intervention> {
    return this.http.put<Intervention>(`${this.url}/interventions/${data.id}`, data);
  }

  deleteIntervention(data: Intervention): Observable<void> {
    return this.http.delete<void>(`${this.url}/interventions/${data.id}`);
  }

  getAllImmobilisations(): Observable<Immobilisation[]> {
    return this.http.get<{ success: boolean; message: string; data: { data: Immobilisation[] } }>(
      `${this.url}/immobilisations`
    ).pipe(
      map((response: { success: boolean; message: string; data: { data: Immobilisation[] } }) =>
        response.data.data // On récupère uniquement le tableau de Immobilisation
      )
    );
  }

  getAllTypeInterventions(): Observable<TypeIntervention[]> {
    return this.http.get<{ success: boolean; message: string; data: { data: TypeIntervention[] } }>(
      `${this.url}/type-interventions`
    ).pipe(
      map((response: { success: boolean; message: string; data: { data: TypeIntervention[] } }) =>
        response.data.data // On récupère uniquement le tableau de TypeIntervention
      )
    );
  }


  imprimerInterventions(): Observable<Blob> {
    const printUrl = `${environment.backend}/interventions/imprimer`;
    console.log('Requête PDF pour les interventions vers:', printUrl);
    return this.http.get(printUrl, { responseType: 'blob' }).pipe(
      tap(() => console.log('PDF des interventions reçu avec succès.')),
      catchError(this.handleError<Blob>('imprimerInterventions'))
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
