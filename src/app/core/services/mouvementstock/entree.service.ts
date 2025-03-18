import { Injectable } from '@angular/core';
import { Observable} from 'rxjs';

import { HttpClient } from '@angular/common/http';
import {environment} from "../../../../environments/environment";
import { MouvementStock, Article, Fournisseur } from "../interface/models";
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class MouvementStockService  {
  private url: string = environment.backend;

  constructor(private http: HttpClient) {}

  getAllMouvementStockEntree(): Observable<MouvementStock[]> {
    return this.http.get<{ success: boolean; message: string; data: { data: MouvementStock[] } }>(
      `${this.url}/mouvement-stock/entree`
    ).pipe(
      map((response: { success: boolean; message: string; data: { data: MouvementStock[] } }) =>
        response.data.data // On récupère uniquement le tableau de MouvementStockEntré
      )
    );
  }

  saveMouvementStockEntree(data: MouvementStock): Observable<MouvementStock> {
    return this.http.post<MouvementStock>(`${this.url}/mouvement-stock/entree`, data);
  }

  editMouvementStockEntree(data: MouvementStock): Observable<MouvementStock> {
    return this.http.put<MouvementStock>(`${this.url}/mouvement-stock/entree/${data.id}`, data);
  }

  deleteMouvementStockEntree(data: MouvementStock): Observable<void> {
    return this.http.delete<void>(`${this.url}/mouvement-stock/entree/${data.id}`);
  }

  getAllArticles(): Observable<Article[]> {
      return this.http.get<{ success: boolean; message: string; data: { data: Article[] } }>(
        `${this.url}/articles`
      ).pipe(
        map((response: { success: boolean; message: string; data: { data: Article[] } }) =>
          response.data.data // On récupère uniquement le tableau de Article
        )
      );
    }

  getAllFournisseurs(): Observable<Fournisseur[]> {
      return this.http.get<{ success: boolean; message: string; data: { data: Fournisseur[] } }>(
        `${this.url}/fournisseurs`
      ).pipe(
        map((response: { success: boolean; message: string; data: { data: Fournisseur[] } }) =>
          response.data.data // On récupère uniquement le tableau de fournisseurs
        )
      );
    }
}
