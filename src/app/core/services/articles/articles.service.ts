// src/app/core/services/articles/articles.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http'; // Ajoute HttpErrorResponse
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

import { environment } from "../../../../environments/environment";
import { Article, Categorie } from "../interface/models"; // Assure-toi que les interfaces sont bien importées

@Injectable({
  providedIn: 'root',
})
export class ArticleService {
  private url: string = environment.backend;

  constructor(private http: HttpClient) {}

  getAllArticles(): Observable<Article[]> {
    return this.http.get<{ success: boolean; message: string; data: { data: Article[] } }>(
      `${this.url}/articles`
    ).pipe(
      tap(response => console.log('Service Article: Réponse brute getAllArticles:', response)),
      map((response: { success: boolean; message: string; data: { data: Article[] } }) =>
        response.data.data
      ),
      catchError(this.handleError<Article[]>('getAllArticles', [])) // Ici, 'handleError' est appelé
    );
  }

  getLatestArticlesWithStock(): Observable<Article[]> {
    return this.getAllArticles().pipe(
      map(articles => {
        const sortedArticles = articles.sort((a, b) => {
          const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return dateB - dateA;
        });
        return sortedArticles.slice(0, 8);
      }),
      tap(data => console.log('Service Article: 6 derniers articles filtrés avec stock:', data)),
      catchError(this.handleError<Article[]>('getLatestArticlesWithStock', []))
    );
  }

  saveArticle(data: Article): Observable<Article> {
    return this.http.post<Article>(`${this.url}/articles`, data).pipe(
      catchError(this.handleError<Article>('saveArticle'))
    );
  }

  editArticle(data: Article): Observable<Article> {
    return this.http.put<Article>(`${this.url}/articles/${data.id}`, data).pipe(
      catchError(this.handleError<Article>('editArticle'))
    );
  }

  deleteArticle(data: Article): Observable<void> {
    return this.http.delete<void>(`${this.url}/articles/${data.id}`).pipe(
      catchError(this.handleError<void>('deleteArticle'))
    );
  }

  getAllCategories(): Observable<Categorie[]> {
    return this.http.get<{ success: boolean; message: string; data: { data: Categorie[] } }>(
      `${this.url}/categorie-articles`
    ).pipe(
      tap(response => console.log('Service Article: Réponse brute getAllCategories:', response)),
      map((response: { success: boolean; message: string; data: { data: Categorie[] } }) =>
        response.data.data
      ),
      catchError(this.handleError<Categorie[]>('getAllCategories', []))
    );
  }

  saveMultipleArticles(articles: Article[]): Observable<any> {
    return this.http.post<any>(`${this.url}/articles/batch`, { articles }).pipe(
      catchError(this.handleError<any>('saveMultipleArticles'))
    );
  }

  imprimerEtatStock(): Observable<Blob> {
    return this.http.get(`${this.url}/etat_stock-imprimer`, { responseType: 'blob' }).pipe(
      catchError(this.handleError<Blob>('imprimerEtatStock'))
    );
  }

  // --- ASSURE-TOI QUE CETTE MÉTHODE EST BIEN PRÉSENTE ET À L'INTÉRIEUR DE LA CLASSE ---
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: HttpErrorResponse): Observable<T> => {
      console.error(`${operation} failed:`, error);
      // Retourne un résultat vide ou par défaut pour que l'application continue de fonctionner
      return of(result as T);
    };
  }
}