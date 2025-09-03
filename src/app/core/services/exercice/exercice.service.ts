import { Injectable } from '@angular/core';
import { Observable} from 'rxjs';

import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { ExerciceResponse, LoginResponse, Permission } from "../interface/models";
import { environment } from '../../../../environments/environment';
import { Exercice } from "../interface/models";

@Injectable({
  providedIn: 'root',
})
export class ExerciceService  {
  private url: string = environment.backend;

  constructor(private http: HttpClient) {}

  getAllExercice(): Observable<Exercice[]> {
    return this.http.get<{ success: boolean; message: string; data: { data: Exercice[] } }>(
      `${this.url}/exercices`
    ).pipe(
      map((response: { success: boolean; message: string; data: { data: Exercice[] } }) =>
        response.data.data // On récupère uniquement le tableau de Exercice
      )
    );
  }

  getExercice(): Observable<ExerciceResponse> {
    return this.http.get<ExerciceResponse>(`${this.url}/exercice/ouvert`);
  }


  saveExercice(data: Exercice): Observable<Exercice> {
    return this.http.post<Exercice>(`${this.url}/exercices`, data);
  }

  editExercice(data: any): Observable<Exercice> {
    return this.http.put<Exercice>(`${this.url}/exercices/${data.id}`, data);
  }

  updateExercice(data: any): Observable<Exercice> {
    // Le chemin est maintenant correct et correspond à la route Laravel.
    return this.http.put<Exercice>(`${this.url}/exercicestate/${data.id}/status`, data);
  }

  deleteExercice(data: Exercice): Observable<void> {
    return this.http.delete<void>(`${this.url}/exercices/${data.id}`);
  }
}
