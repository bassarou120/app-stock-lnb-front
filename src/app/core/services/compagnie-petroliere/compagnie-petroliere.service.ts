import { Injectable } from '@angular/core';
import { Observable} from 'rxjs';

import { HttpClient } from '@angular/common/http';
import {environment} from "../../../../environments/environment";
import { CompagniePetroliere } from "../interface/models";
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class CompagniePetroliereService {
  private url: string = environment.backend;

  constructor(private http: HttpClient) {}

  getAllCompagniePetrolieres(): Observable<CompagniePetroliere[]> {
    return this.http.get<{ success: boolean; message: string; data: { data: CompagniePetroliere[] } }>(
      `${this.url}/compagnie_petrolier`
    ).pipe(
      map((response: { success: boolean; message: string; data: { data: CompagniePetroliere[] } }) =>
        response.data.data // On récupère uniquement le tableau de CompagniePetroliere
      )
    );
  }

  saveCompagniePetroliere(data: CompagniePetroliere): Observable<CompagniePetroliere> {
    return this.http.post<CompagniePetroliere>(`${this.url}/compagnie_petrolier`, data);
  }

  editCompagniePetroliere(data: CompagniePetroliere): Observable<CompagniePetroliere> {
    return this.http.put<CompagniePetroliere>(`${this.url}/compagnie_petrolier/${data.id}`, data);
  }

  deleteCompagniePetroliere(data: CompagniePetroliere): Observable<void> {
    return this.http.delete<void>(`${this.url}/compagnie_petrolier/${data.id}`);
  }
}
