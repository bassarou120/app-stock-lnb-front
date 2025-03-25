import { Injectable } from '@angular/core';
import { Observable} from 'rxjs';

import { HttpClient } from '@angular/common/http';
import {environment} from "../../../../environments/environment";
import { Vehicule, Marque, Modele } from "../interface/models";
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class VehiculeService  {
  private url: string = environment.backend;

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

  saveVehicule(data: Vehicule): Observable<Vehicule> {
    return this.http.post<Vehicule>(`${this.url}/vehicules`, data);
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
}
