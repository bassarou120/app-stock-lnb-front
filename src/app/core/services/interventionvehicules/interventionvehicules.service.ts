import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from "../../../../environments/environment";
import { Vehicule, InterventionVehicule, Commune, TypeIntervention } from "../interface/models"; // Importez vos modèles
import { map } from 'rxjs/operators';

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


  saveInterventionVehicule(data: InterventionVehicule): Observable<InterventionVehicule> {
    return this.http.post<InterventionVehicule>(`${this.url}/intervention-vehicules`, data);
  }

  editInterventionVehicule(data: InterventionVehicule): Observable<InterventionVehicule> {
    return this.http.put<InterventionVehicule>(`${this.url}/intervention-vehicules/${data.id}`, data);
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
}
