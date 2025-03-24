import { Injectable } from '@angular/core';
import { Observable} from 'rxjs';

import { HttpClient } from '@angular/common/http';
import {environment} from "../../../../environments/environment";
import { Article, Categorie } from "../interface/models";
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class DashboardStockService  {
  private url: string = environment.backend;

  constructor(private http: HttpClient) {}

  getAllArticles(): Observable<Article[]> {
    return this.http.get<{ success: boolean; message: string; data: { data: Article[] } }>(
      `${this.url}/dashboard/stock`
    ).pipe(
      map((response: { success: boolean; message: string; data: { data: Article[] } }) =>
        response.data.data // On récupère uniquement le tableau de Article
      )
    );
  }
  getdashInfoStock() {
    return this.http.get<any>(`${this.url}/dashboard/dashInfoStock`);
  }
}
