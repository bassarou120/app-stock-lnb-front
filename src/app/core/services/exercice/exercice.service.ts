import { Injectable } from '@angular/core';
import { Observable} from 'rxjs';

import { HttpClient } from '@angular/common/http';
import {environment} from "../../../../environments/environment";
import { Exercice } from "../interface/models";
import { map } from 'rxjs/operators';

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

  saveExercice(data: Exercice): Observable<Exercice> {
    return this.http.post<Exercice>(`${this.url}/exercices`, data);
  }

  editExercice(data: Exercice): Observable<Exercice> {
    return this.http.put<Exercice>(`${this.url}/exercices/${data.id}`, data);
  }

  deleteExercice(data: Exercice): Observable<void> {
    return this.http.delete<void>(`${this.url}/exercices/${data.id}`);
  }
}
