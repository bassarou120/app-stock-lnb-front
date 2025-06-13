import { Injectable } from '@angular/core';
import { Observable, of} from 'rxjs';

import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import {environment} from "../../../../environments/environment";
import { MouvementStock, Article, Fournisseur } from "../interface/models";
import { catchError, map, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class MouvementStockService  {
  private url: string = environment.backend;
  private apiUrl = `${environment.backend}`; // URL de base

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

  saveMouvementStockEntree(formData: FormData): Observable<MouvementStock> {
    return this.http.post<MouvementStock>(`${this.url}/mouvement-stock/entree`, formData);
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

  // Nouvelle méthode pour l'ajout multiple
  saveMultipleMouvementStockEntree(formData: FormData): Observable<any> {
    return this.http.post<any>(`${this.url}/mouvement-stock/entree-multiple`, formData);
  }

  imprimerMouvementsEntree(): Observable<Blob> {
    const printUrl = `${this.apiUrl}/imprimerEntrees`; // L'URL de ton endpoint Laravel pour l'impression
    console.log('Requête PDF pour les mouvements d\'entrée vers:', printUrl);
    return this.http.get(printUrl, { responseType: 'blob' }).pipe(
      tap(() => console.log('PDF des mouvements d\'entrée reçu.')),
      catchError(this.handleError<Blob>('imprimerMouvementsEntree'))
    );
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: HttpErrorResponse): Observable<T> => {
      console.error(`${operation} failed:`, error);
      // Retourne un résultat vide ou par défaut pour que l'application continue de fonctionner
      return of(result as T);
    };
  }

getRapportEntreeStock(params: {
  date_debut: string;
  date_fin: string;
  libelle?: string;
  id_fournisseur?: number;
}): Observable<{
  success: boolean;
  message: string;
  data: {
    current_page: number;
    data: any[]; // Tu peux remplacer `any` par un type `MouvementStock` si tu en as un
  };
}> {
  const url = `${this.apiUrl}/rapport-entrestock`;

  return this.http.get<{
    success: boolean;
    message: string;
    data: {
      current_page: number;
      data: any[];
    };
  }>(url, { params: this.buildHttpParams(params) });
}

private buildHttpParams(params: any): HttpParams {
    let httpParams = new HttpParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        httpParams = httpParams.set(key, params[key]);
      }
    });
    return httpParams;
  }


}
