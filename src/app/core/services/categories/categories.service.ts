import { Injectable } from '@angular/core';
import { Observable} from 'rxjs';

import { HttpClient } from '@angular/common/http';
import {environment} from "../../../../environments/environment";
import { Categorie } from "../interface/models";
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class CategorieService  {
  private url: string = environment.backend;

  constructor(private http: HttpClient) {}

  getAllCategories(): Observable<Categorie[]> {
    return this.http.get<{ success: boolean; message: string; data: { data: Categorie[] } }>(
      `${this.url}/categorie-articles`
    ).pipe(
      map((response: { success: boolean; message: string; data: { data: Categorie[] } }) =>
        response.data.data // On récupère uniquement le tableau de Categorie
      )
    );
  }

  saveCategorie(data: Categorie): Observable<Categorie> {
    return this.http.post<Categorie>(`${this.url}/categorie-articles`, data);
  }

  editCategorie(data: Categorie): Observable<Categorie> {
    return this.http.put<Categorie>(`${this.url}/categorie-articles/${data.id}`, data);
  }

  deleteCategorie(data: Categorie): Observable<void> {
    return this.http.delete<void>(`${this.url}/categorie-articles/${data.id}`);
  }
}
