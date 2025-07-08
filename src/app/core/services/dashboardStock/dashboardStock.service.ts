import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from "../../../../environments/environment";
import { catchError, map, tap } from 'rxjs/operators';
import { Article, PaginatedResponse, User, InterventionVehicule } from "../interface/models"; // Gardez cette importation si vous utilisez toujours Article

// Importez les interfaces que nous venons de définir
import { DashboardData, ApiResponse } from '../interface/models'; // Vérifiez que le chemin est correct

@Injectable({
  providedIn: 'root',
})
export class DashboardStockService {
  private url: string = environment.backend;

  constructor(private http: HttpClient) {}

  getAllArticles(): Observable<Article[]> {
    
    return this.http.get<ApiResponse<{ data: Article[] }>>(`${this.url}/dashboard/stock`).pipe(
      map(response => response.data.data) 
    );
  }

  
  getdashInfoStock(): Observable<DashboardData> {
    return this.http.get<ApiResponse<DashboardData>>(`${this.url}/dashboard/dashInfoStock`).pipe(
      map(response => response.data) 
    );
  }

    getVehiculesAssurancesExpirantes(): Observable<InterventionVehicule> {
    return this.http.get<ApiResponse<InterventionVehicule>>(`${this.url}/assurance-expiresoon`).pipe(
      map(response => response.data) 
    );
  }

  getUsersWithRoles(): Observable<User[]> {
    const apiUrl = `${this.url}/users`; 
    console.log('Service : Tentative d\'appel API pour les utilisateurs vers:', apiUrl);

    return this.http.get<PaginatedResponse<User> | User[]>(apiUrl).pipe( 
      tap(response => console.log('Service : Réponse API brute pour les utilisateurs reçue (avant le map):', response)), 
      map(response => {
      
        if (response && typeof response === 'object' && 'data' in response && Array.isArray((response as PaginatedResponse<User>).data)) {
          console.log('Service : Mappé comme PaginatedResponse.data. Données extraites:', (response as PaginatedResponse<User>).data);
          return (response as PaginatedResponse<User>).data; 
        }
        
        else if (Array.isArray(response)) {
          console.log('Service : Mappé comme un tableau direct. Données extraites:', response);
          return response;
        }
        
        else if (response && typeof response === 'object' && 'data' in response && 'data' in (response as any).data && Array.isArray((response as any).data.data)) {
             console.log('Service : Mappé comme PostResource.data.data. Données extraites:', (response as any).data.data);
             return (response as any).data.data;
        }
        else {
          console.error('Service : Format de réponse API inattendu pour les utilisateurs:', response);
          return []; 
        }
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('Service : Erreur lors de la récupération des utilisateurs dans getUsersWithRoles:', error);
        
        return of([]);
      })
    );
}

}