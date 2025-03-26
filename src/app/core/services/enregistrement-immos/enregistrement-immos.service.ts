import { Injectable } from '@angular/core';
import { Observable} from 'rxjs';

import { HttpClient } from '@angular/common/http';
import {environment} from "../../../../environments/environment";
import { Immobilisation } from "../interface/models";
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class ImmobilisationsService  {
  private url: string = environment.backend;

  constructor(private http: HttpClient) {}

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
}
