// src/app/core/services/articles/articles.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http'; // Ajoute HttpErrorResponse
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

import { environment } from "../../../../environments/environment";
import { SortiePatrimoine } from "../interface/models";

@Injectable({
  providedIn: 'root',
})
export class SortiePatrimoineService {
  private url: string = environment.backend;

  constructor(private http: HttpClient) {}

  getAllSortiePatrimoines(): Observable<SortiePatrimoine[]> {
    return this.http.get<{ success: boolean; message: string; data: { data: SortiePatrimoine[] } }>(
      `${this.url}/sortiepatrimoines`
    ).pipe(
      tap(response => console.log('Service Sortie patrimoine: Réponse brute getAllSortiePatrimoines:', response)),
      map((response: { success: boolean; message: string; data: { data: SortiePatrimoine[] } }) =>
        response.data.data
      ),
      catchError(this.handleError<SortiePatrimoine[]>('getAllSortiePatrimoines', [])) // Ici, 'handleError' est appelé
    );
  }

  getSortiePatrimoineById(id: number): Observable<SortiePatrimoine> {
    // Méthode manquante mais cruciale pour la route GET /sortiepatrimoines/{id}
    return this.http.get<{ success: boolean; message: string; data: SortiePatrimoine }>(
        `${this.url}/sortiepatrimoines/${id}`
      ).pipe(
        map(response => response.data),
        catchError(this.handleError<SortiePatrimoine>('getSortiePatrimoineById'))
      );
  }

  saveSortiePatrimoine(data: SortiePatrimoine): Observable<SortiePatrimoine> {
    return this.http.post<SortiePatrimoine>(`${this.url}/sortiepatrimoines`, data).pipe(
      catchError(this.handleError<SortiePatrimoine>('saveSortiePatrimoine'))
    );
  }

  editSortiePatrimoine(data: SortiePatrimoine): Observable<SortiePatrimoine> {
    return this.http.put<SortiePatrimoine>(`${this.url}/sortiepatrimoines/${data.id}`, data).pipe(
      catchError(this.handleError<SortiePatrimoine>('editSortiePatrimoine'))
    );
  }

deleteSortiePatrimoine(id: number): Observable<void> {
  return this.http.delete<void>(`${this.url}/sortiepatrimoines/${id}`).pipe(
    catchError(this.handleError<void>('deleteSortiePatrimoine'))
  );
}


saveMultipleSorties(sorties: SortiePatrimoine[]): Observable<any> { // Renommer la variable pour plus de clarté
    // Le corps de la requête doit correspondre à la validation du contrôleur (clé: 'sorties')
    return this.http.post<any>(`${this.url}/sortiepatrimoines/batch`, { sorties: sorties }).pipe( // <-- CORRIGÉ
      catchError(this.handleError<any>('saveMultipleSorties'))
    );
  }

  imprimerEtatStock(): Observable<Blob> {
    return this.http.get(`${this.url}/etat_stock-imprimer`, { responseType: 'blob' }).pipe(
      catchError(this.handleError<Blob>('imprimerEtatStock'))
    );
  }

  downloadExcel() {
    return this.http.get(`${this.url}/etat_stock-imprimer-excel`, {
      responseType: 'blob' // important pour gérer les fichiers binaires
    });
  }

    importSortiePatrimoine(formData: FormData): Observable<any> {
      // L'URL complète de l'endpoint d'importation
      return this.http.post(`${this.url}/sortiepatrimoines/import`, formData);
    }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: HttpErrorResponse): Observable<T> => {
      console.error(`${operation} failed:`, error);
      // Retourne un résultat vide ou par défaut pour que l'application continue de fonctionner
      return of(result as T);
    };
  }
}
