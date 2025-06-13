import { Injectable } from '@angular/core';
import { Observable, of} from 'rxjs';

import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';

import { MouvementStock, Article, Fournisseur } from "../../interface/models";
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';
import { Immobilisation, TypeMouvement } from "../../interface/models";


@Injectable({
  providedIn: 'root'
})
export class StockService {
    private url: string = environment.backend;
    private apiUrl = `${environment.backend}`; // URL de base

 constructor(private http: HttpClient) {}


getRapportEntreeStock(params: {
  date_debut: string;
  date_fin: string;
  id_article?: string;
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



  getAllArticles(): Observable<Article[]> {
    return this.http.get<{ success: boolean; message: string; data: { data: Article[] } }>(
      `${this.url}/articles`
    ).pipe(
      map((response: { success: boolean; message: string; data: { data: Article[] } }) =>
        response.data.data // On récupère uniquement le tableau de Article
      )
    );
  }
  getAllFournisseur(): Observable<Fournisseur[]> {
    return this.http.get<{ success: boolean; message: string; data: { data: Fournisseur[] } }>(
      `${this.url}/fournisseur`
    ).pipe(
      map((response: { success: boolean; message: string; data: { data: Fournisseur[] } }) =>
        response.data.data // On récupère uniquement le tableau de Bureau
      )
    );
  }

    getAllTypeMouvement(): Observable<TypeMouvement[]> {
    return this.http.get<{ success: boolean; message: string; data: { data: TypeMouvement[] } }>(
      `${this.url}/type_mouvements`
    ).pipe(
      map((response: { success: boolean; message: string; data: { data: TypeMouvement[] } }) =>
        response.data.data // On récupère uniquement le tableau de MouvementStockEntré
      )
    );
  }


}
