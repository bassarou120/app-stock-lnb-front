import { Injectable } from '@angular/core';
import { Observable} from 'rxjs';

import { HttpClient } from '@angular/common/http';
import {environment} from "../../../../environments/environment";
import { MouvementStock, Article, Bureau, Employe } from "../interface/models";
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class MouvementStockService  {
  private url: string = environment.backend;

  constructor(private http: HttpClient) {}

  getAllMouvementStockSortie(): Observable<MouvementStock[]> {
    return this.http.get<{ success: boolean; message: string; data: { data: MouvementStock[] } }>(
      `${this.url}/mouvement-stock/sortie`
    ).pipe(
      map((response: { success: boolean; message: string; data: { data: MouvementStock[] } }) =>
        response.data.data // On récupère uniquement le tableau de MouvementStockSortie
      )
    );
  }

  getQuantiteDisponible(idArticle: number): Observable<any> {
    return this.http.get<any>(`${this.url}/quantite-disponible/${idArticle}`);
  }


  saveMouvementStockSortie(data: MouvementStock): Observable<MouvementStock> {
    return this.http.post<MouvementStock>(`${this.url}/mouvement-stock/sortie`, data);
  }
  editMouvementStockSortie(data: MouvementStock): Observable<MouvementStock> {
    return this.http.put<MouvementStock>(`${this.url}/mouvement-stock/sortie/${data.id}`, data);
  }


  deleteMouvementStockSortie(data: MouvementStock): Observable<void> {
    return this.http.delete<void>(`${this.url}/mouvement-stock/sortie/${data.id}`);
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
    getAllBureaux(): Observable<Bureau[]> {
      return this.http.get<{ success: boolean; message: string; data: { data: Bureau[] } }>(
        `${this.url}/bureaux`
      ).pipe(
        map((response: { success: boolean; message: string; data: { data: Bureau[] } }) =>
          response.data.data // On récupère uniquement le tableau de Bureau
        )
      );
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

}
