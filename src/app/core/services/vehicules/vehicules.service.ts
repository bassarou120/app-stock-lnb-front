import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import {environment} from "../../../../environments/environment";
import { Vehicule, Marque, Modele } from "../interface/models";
import { catchError, map, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class VehiculeService  {
  private url: string = environment.backend;
  private apiUrl = `${environment.backend}`; // URL de base


  constructor(private http: HttpClient) {}

  getAllVehicules(): Observable<Vehicule[]> {
    return this.http.get<{ success: boolean; message: string; data: { data: Vehicule[] } }>(
      `${this.url}/vehicules`
    ).pipe(
      map((response: { success: boolean; message: string; data: { data: Vehicule[] } }) =>
        response.data.data // On récupère uniquement le tableau de Article
      )
    );
  }

  editVehicule(data: Vehicule): Observable<Vehicule> {
    return this.http.put<Vehicule>(`${this.url}/vehicules/${data.id}`, data);
  }

  deleteVehicule(data: Vehicule): Observable<void> {
    return this.http.delete<void>(`${this.url}/vehicules/${data.id}`);
  }


  // Nouvelle méthode pour sauvegarder plusieurs articles
  saveMultipleVehicules(vehicules: Vehicule[]): Observable<any> {
    return this.http.post<any>(`${this.url}/vehicules/batch`, { vehicules });
  }

  getAllModeles(): Observable<Modele[]> {
    return this.http.get<{ success: boolean; message: string; data: { data: Modele[] } }>(
      `${this.url}/modeles`
    ).pipe(
      map((response: { success: boolean; message: string; data: { data: Modele[] } }) =>
        response.data.data // On récupère uniquement le tableau de Modele
      )
    );
  }

  getAllMarques(): Observable<Marque[]> {
    return this.http.get<{ success: boolean; message: string; data: { data: Marque[] } }>(
      `${this.url}/marques`
    ).pipe(
      map((response: { success: boolean; message: string; data: { data: Marque[] } }) =>
        response.data.data // On récupère uniquement le tableau de Marque
      )
    );
  }

  imprimerVehicule(): Observable<Blob> {
    const printUrl = `${this.apiUrl}/vehicules-imprimer`; // L'URL de ton endpoint Laravel pour l'impression
    console.log('Requête PDF pour les la liste des vehicules vers:', printUrl);
    return this.http.get(printUrl, { responseType: 'blob' }).pipe(
      tap(() => console.log('PDF de la liste des véhicules.')),
      catchError(this.handleError<Blob>('imprimerVehicule'))
    );
  }

  importVehicules(formData: FormData): Observable<any> {
    // L'URL complète de l'endpoint d'importation
    return this.http.post(`${this.apiUrl}/vehicules/import`, formData);
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: HttpErrorResponse): Observable<T> => {
      console.error(`${operation} failed:`, error);
      // Retourne un résultat vide ou par défaut pour que l'application continue de fonctionner
      return of(result as T);
    };
  }


uploadCarteGrise(vehiculeId: number, formData: FormData): Observable<any> {
  return this.http.post(`${this.apiUrl}/vehicules/${vehiculeId}/carte-grise`, formData);
}




}
