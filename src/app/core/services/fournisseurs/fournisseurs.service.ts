import { Injectable } from '@angular/core';
import { Observable} from 'rxjs';

import { HttpClient } from '@angular/common/http';
import {environment} from "../../../../environments/environment";
import { Fournisseur } from "../interface/models";
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class FournisseursService {
  private url: string = environment.backend;

  constructor(private http: HttpClient) {}

  getAllFournisseurs(): Observable<Fournisseur[]> {
    return this.http.get<{ success: boolean; message: string; data: { data: Fournisseur[] } }>(
      `${this.url}/fournisseurs`
    ).pipe(
      map((response: { success: boolean; message: string; data: { data: Fournisseur[] } }) => 
        response.data.data // On récupère uniquement le tableau de fournisseurs
      )
    ); 
  }

  saveFournisseur(data: Fournisseur): Observable<Fournisseur> {
    return this.http.post<Fournisseur>(`${this.url}/fournisseurs`, data);
  }

  editFournisseur(data: Fournisseur): Observable<Fournisseur> {
    return this.http.put<Fournisseur>(`${this.url}/fournisseurs/${data.id}`, data);
  }

  deleteFournisseur(data: Fournisseur): Observable<void> {
    return this.http.delete<void>(`${this.url}/fournisseurs/${data.id}`);
  }
}
