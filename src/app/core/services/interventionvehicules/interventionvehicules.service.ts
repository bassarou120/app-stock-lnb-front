import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from "../../../../environments/environment";
import { Vehicule, InterventionVehicule, Commune, TypeIntervention } from "../interface/models"; // Importez vos modèles
import { catchError, map, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class InterventionsVehiculeService {
  private url: string = environment.backend;

  constructor(private http: HttpClient) { }

  getAllInterventionsVehicule(): Observable<InterventionVehicule[]> {
    return this.http.get<{ success: boolean; message: string; data: { data: InterventionVehicule[] } }>(
      `${this.url}/intervention-vehicules`
    ).pipe(
      map((response: { success: boolean; message: string; data: { data: InterventionVehicule[] } }) =>
        response.data.data
      )
    );
  }


  saveInterventionVehicule(data: FormData): Observable<InterventionVehicule> {
    return this.http.post<InterventionVehicule>(`${this.url}/intervention-vehicules`, data);
  }

  editInterventionVehicule(id: number, data: FormData): Observable<InterventionVehicule> {
    // 💡 On utilise POST pour contourner les limitations du PUT avec FormData.
    // Le composant ajoutera '_method: PUT' à FormData pour que Laravel sache quoi faire.
    return this.http.post<InterventionVehicule>(`${this.url}/intervention-vehicules/${id}`, data);
  }

  deleteInterventionVehicule(data: InterventionVehicule): Observable<void> {
    return this.http.delete<void>(`${this.url}/intervention-vehicules/${data.id}`);
  }

  // Adaptez ces méthodes en fonction de vos besoins
  getAllVehicules(): Observable<Vehicule[]> {
    return this.http.get<{ success: boolean; message: string; data: { data: Vehicule[] } }>(
      `${this.url}/vehicules`
    ).pipe(
      map((response: { success: boolean; message: string; data: { data: Vehicule[] } }) =>
        response.data.data
      )
    );
  }

  getAllTypeInterventions(): Observable<TypeIntervention[]> {
    return this.http.get<{ success: boolean; message: string; data: { data: TypeIntervention[] } }>(
      `${this.url}/type-interventions`
    ).pipe(
      map((response: { success: boolean; message: string; data: { data: TypeIntervention[] } }) =>
        response.data.data // On récupère uniquement le tableau de TypeIntervention
      )
    );
  }

  getAllCommunes(): Observable<Commune[]> {
    return this.http.get<{ success: boolean; message: string; data: { data: Commune[] } }>(
      `${this.url}/communes`
    ).pipe(
      map((response: { success: boolean; message: string; data: { data: Commune[] } }) =>
        response.data.data // On récupère uniquement le tableau de Commune
      )
    );
  }

  getAllInterventions_vehicule(): Observable<InterventionVehicule[]> {
    return this.http.get<{ success: boolean; message: string; data: { data: InterventionVehicule[] } }>(
      `${this.url}/intervention_vehicule`
    ).pipe(
      map((response: { success: boolean; message: string; data: { data: InterventionVehicule[] } }) =>
        response.data.data // On récupère uniquement le tableau de TypeIntervention
      )
    );
  }

  imprimerInterventionsVehicule(): Observable<Blob> {
    const printUrl = `${environment.backend}/interventions-vehicule/imprimer`;
    console.log('Requête PDF pour les interventions de véhicule vers:', printUrl);
    return this.http.get(printUrl, { responseType: 'blob' }).pipe(
      tap(() => console.log('PDF des interventions de véhicule reçu avec succès.')),
      catchError(this.handleError<Blob>('imprimerInterventionsVehicule'))
    );
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: HttpErrorResponse): Observable<T> => {
      console.error(`${operation} failed:`, error);
      // Retourne un résultat vide ou par défaut pour que l'application continue de fonctionner
      return of(result as T);
    };
  }
}
