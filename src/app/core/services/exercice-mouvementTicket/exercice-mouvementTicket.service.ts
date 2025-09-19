import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http'; // Ajoute HttpErrorResponse
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

import { environment } from "../../../../environments/environment";
import { ExerciceMouvementTicket } from "../interface/models";

@Injectable({
  providedIn: 'root'
})
export class ExerciceMouvementTicketService {

    private url: string = environment.backend;

  constructor(private http: HttpClient) {}

  getAllExerciceMouvementTickets(): Observable<ExerciceMouvementTicket[]> {
    return this.http.get<{ success: boolean; message: string; data: ExerciceMouvementTicket[] }>(
      `${this.url}/exercice-mouvement-tickets`
    ).pipe(
      tap(response => console.log('Service Exercice Mouvement Ticket: Réponse brute getAllExerciceMouvementTickets:', response)),
      map(response => response.data),
      catchError(this.handleError<ExerciceMouvementTicket[]>('getAllExerciceMouvementTickets', []))
    );
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: HttpErrorResponse): Observable<T> => {
      console.error(`${operation} failed:`, error);
      // Retourne un résultat vide ou par défaut pour que l'application continue de fonctionner
      return of(result as T);
    };
  }
/*   imprimerEtat(): Observable<Blob> {
    return this.http.get(`${this.url}/exerciceMouvementTickets/imprimerEtat`, { responseType: 'blob' }).pipe(
      catchError(this.handleError<Blob>('imprimerEtat'))
    );
  } */


}
