import { Injectable } from '@angular/core';
import { Observable} from 'rxjs';

import { HttpClient } from '@angular/common/http';
import {environment} from "../../../../environments/environment";
import { Modele } from "../interface/models";
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class ModelesService {
  private url: string = environment.backend;

  constructor(private http: HttpClient) {}

  getAllModeles(): Observable<Modele[]> {
    return this.http.get<{ success: boolean; message: string; data: { data: Modele[] } }>(
      `${this.url}/modeles`
    ).pipe(
      map((response: { success: boolean; message: string; data: { data: Modele[] } }) =>
        response.data.data // On récupère uniquement le tableau de Modele
      )
    );
  }

  saveModele(data: Modele): Observable<Modele> {
    return this.http.post<Modele>(`${this.url}/modeles`, data);
  }

  editModele(data: Modele): Observable<Modele> {
    return this.http.put<Modele>(`${this.url}/modeles/${data.id}`, data);
  }

  deleteModele(data: Modele): Observable<void> {
    return this.http.delete<void>(`${this.url}/modeles/${data.id}`);
  }
}
