import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from "../../../../environments/environment";
import { catchError, map, tap } from 'rxjs/operators';
import { Article, PaginatedResponse, User } from "../interface/models"; // Gardez cette importation si vous utilisez toujours Article

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

  getUsersWithRoles(): Observable<User[]> {
    const apiUrl = `${this.url}/users`; // L'URL pour les utilisateurs doit être /api/users
    console.log('Service : Tentative d\'appel API pour les utilisateurs vers:', apiUrl);

    return this.http.get<PaginatedResponse<User> | User[]>(apiUrl).pipe( // On peut recevoir une réponse paginée ou un tableau direct
      tap(response => console.log('Service : Réponse API brute pour les utilisateurs reçue (avant le map):', response)), // Log la réponse AVANT le map
      map(response => {
        // **LOGIQUE CRITIQUE : ADAPTER CELA EN FONCTION DE LA STRUCTURE RÉELLE DE LA RÉPONSE DE LARAVEL**
        // Scénario 1: Réponse de Laravel avec paginate() : { current_page: ..., data: [...], ... }
        if (response && typeof response === 'object' && 'data' in response && Array.isArray((response as PaginatedResponse<User>).data)) {
          console.log('Service : Mappé comme PaginatedResponse.data. Données extraites:', (response as PaginatedResponse<User>).data);
          return (response as PaginatedResponse<User>).data; // C'est le tableau d'utilisateurs
        }
        // Scénario 2: Laravel renvoie directement un tableau d'utilisateurs ([...])
        else if (Array.isArray(response)) {
          console.log('Service : Mappé comme un tableau direct. Données extraites:', response);
          return response;
        }
        // Scénario 3: Structure de PostResource { success: ..., message: ..., data: { data: [...] } }
        // (Moins probable si tu utilises paginate() simple, mais à garder en tête)
        else if (response && typeof response === 'object' && 'data' in response && 'data' in (response as any).data && Array.isArray((response as any).data.data)) {
             console.log('Service : Mappé comme PostResource.data.data. Données extraites:', (response as any).data.data);
             return (response as any).data.data;
        }
        else {
          console.error('Service : Format de réponse API inattendu pour les utilisateurs:', response);
          return []; // Retourne un tableau vide pour éviter 'forEach' sur undefined
        }
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Service : Erreur lors de la récupération des utilisateurs dans getUsersWithRoles:', error);
        // Important : retourner un tableau vide en cas d'erreur pour que le composant ne plante pas.
        return of([]);
      })
    );
}

}