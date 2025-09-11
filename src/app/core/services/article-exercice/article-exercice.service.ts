import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http'; // Ajoute HttpErrorResponse
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

import { environment } from "../../../../environments/environment";
import { ArticleExercice } from "../interface/models";

@Injectable({
  providedIn: 'root'
})
export class ArticleExerciceService {

    private url: string = environment.backend;

  constructor(private http: HttpClient) {}

  getAllArticlExercices(): Observable<ArticleExercice[]> {
    return this.http.get<{ success: boolean; message: string; data: ArticleExercice[] }>(
      `${this.url}/articlesExercices`
    ).pipe(
      tap(response => console.log('Service Article: Réponse brute getAllArticlExercices:', response)),
      map(response => response.data),
      catchError(this.handleError<ArticleExercice[]>('getAllArticlExercices', []))
    );
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: HttpErrorResponse): Observable<T> => {
      console.error(`${operation} failed:`, error);
      // Retourne un résultat vide ou par défaut pour que l'application continue de fonctionner
      return of(result as T);
    };
  }
    imprimerEtat(): Observable<Blob> {
    return this.http.get(`${this.url}/`, { responseType: 'blob' }).pipe(
      catchError(this.handleError<Blob>(''))
    );
  }


}
