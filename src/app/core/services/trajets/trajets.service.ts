import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { HttpClient } from '@angular/common/http';
import { environment } from "../../../../environments/environment";
import { Transfert, Employe, Immobilisation, Bureau } from "../interface/models";
import { map } from 'rxjs/operators';

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

        getOldInfo(idImmo: number): Observable<any> {
          return this.http.get<any>(`${this.url}/ancien-info/${idImmo}`);
        }



}
