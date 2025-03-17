import { Injectable } from '@angular/core';
import { Observable} from 'rxjs';

import { HttpClient } from '@angular/common/http';
import {environment} from "../../../../environments/environment";
import { Article, Categorie } from "../interface/models";
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class ArticleService  {
  private url: string = environment.backend;

  constructor(private http: HttpClient) {}

  getAllArticles(): Observable<Article[]> {
    return this.http.get<{ success: boolean; message: string; data: { data: Article[] } }>(
      `${this.url}/articles`
    ).pipe(
      map((response: { success: boolean; message: string; data: { data: Article[] } }) =>
        response.data.data // On récupère uniquement le tableau de Article
      )
    );
  }

  saveArticle(data: Article): Observable<Article> {
    return this.http.post<Article>(`${this.url}/articles`, data);
  }

  editArticle(data: Article): Observable<Article> {
    return this.http.put<Article>(`${this.url}/articles/${data.id}`, data);
  }

  deleteArticle(data: Article): Observable<void> {
    return this.http.delete<void>(`${this.url}/articles/${data.id}`);
  }

  getAllCategories(): Observable<Categorie[]> {
      return this.http.get<{ success: boolean; message: string; data: { data: Categorie[] } }>(
        `${this.url}/categorie-articles`
      ).pipe(
        map((response: { success: boolean; message: string; data: { data: Categorie[] } }) =>
          response.data.data // On récupère uniquement le tableau de Categorie
        )
      );
    }
  // Nouvelle méthode pour sauvegarder plusieurs articles
  saveMultipleArticles(articles: Article[]): Observable<any> {
    return this.http.post<any>(`${this.url}/articles/batch`, { articles });
  }
}
