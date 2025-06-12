import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from "../../../../environments/environment";
import { Transfert, Employe, Immobilisation, Bureau } from "../interface/models";
import { catchError, map, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class TransfertsService {
  private url: string = environment.backend;

  constructor(private http: HttpClient) { }

  getAllTransferts(): Observable<Transfert[]> {
    return this.http.get<{ success: boolean; message: string; data: { data: Transfert[] } }>(
      `${this.url}/transferts`
    ).pipe(
      map((response: { success: boolean; message: string; data: { data: Transfert[] } }) =>
        response.data.data // On récupère uniquement le tableau des Transfert
      )
    );
  }

  saveTransfert(data: Transfert): Observable<Transfert> {
    return this.http.post<Transfert>(`${this.url}/transferts`, data);
  }

  editTransfert(data: Transfert): Observable<Transfert> {
    return this.http.put<Transfert>(`${this.url}/transferts/${data.id}`, data);
  }

  deleteTransfert(data: Transfert): Observable<void> {
    return this.http.delete<void>(`${this.url}/transferts/${data.id}`);
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

    getAllImmobilisations(): Observable<Immobilisation[]> {
        return this.http.get<{ success: boolean; message: string; data: { data: Immobilisation[] } }>(
          `${this.url}/immobilisations`
        ).pipe(
          map((response: { success: boolean; message: string; data: { data: Immobilisation[] } }) =>
            response.data.data // On récupère uniquement le tableau de Immobilisation
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

        imprimerTransferts(): Observable<Blob> {
          const printUrl = `${environment.backend}/transferts/imprimer`; // L'URL de ton endpoint Laravel pour l'impression
          console.log('Requête PDF pour les transferts vers:', printUrl);
          return this.http.get(printUrl, { responseType: 'blob' }).pipe(
            tap(() => console.log('PDF des transferts reçu.')),
            catchError(this.handleError<Blob>('imprimerTransferts'))
          );
        }

        private handleError<T>(operation = 'operation', result?: T) {
          return (error: HttpErrorResponse): Observable<T> => {
            console.error(`${operation} failed:`, error);
            // Retourne un résultat vide ou par défaut pour que l'application continue de fonctionner
            return of(result as T);
          };
        }
        
        getOldInfo(idImmo: number): Observable<any> {
          return this.http.get<any>(`${this.url}/ancien-info/${idImmo}`);
        }



}
