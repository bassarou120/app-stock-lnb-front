import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from "../../../../environments/environment";
import { map } from 'rxjs/operators';
import { Article } from "../interface/models"; // Gardez cette importation si vous utilisez toujours Article

// Importez les interfaces que nous venons de définir
import { DashboardData, ApiResponse } from '../interface/models'; // Vérifiez que le chemin est correct

@Injectable({
  providedIn: 'root',
})
export class DashboardStockService {
  private url: string = environment.backend;

  constructor(private http: HttpClient) {}

  getAllArticles(): Observable<Article[]> {
    // Le typage ici est déjà bon pour l'API des articles
    return this.http.get<ApiResponse<{ data: Article[] }>>(`${this.url}/dashboard/stock`).pipe(
      map(response => response.data.data) // Extrait le tableau d'articles du double 'data'
    );
  }

  
  getdashInfoStock(): Observable<DashboardData> {
    return this.http.get<ApiResponse<DashboardData>>(`${this.url}/dashboard/dashInfoStock`).pipe(
      map(response => response.data) // Extrait l'objet 'data' qui correspond à DashboardData
    );
  }
}