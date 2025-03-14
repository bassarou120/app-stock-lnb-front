import { Injectable } from '@angular/core';
import { Observable} from 'rxjs';

import { HttpClient } from '@angular/common/http';
import {environment} from "../../../../environments/environment";
import { TypeIntervention } from "../interface/models";
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class TypeInterventionService {
  private url: string = environment.backend;

  constructor(private http: HttpClient) {}

  getAllTypeInterventions(): Observable<TypeIntervention[]> {
    return this.http.get<{ success: boolean; message: string; data: { data: TypeIntervention[] } }>(
      `${this.url}/type-interventions`
    ).pipe(
      map((response: { success: boolean; message: string; data: { data: TypeIntervention[] } }) => 
        response.data.data // On récupère uniquement le tableau de TypeIntervention
      )
    ); 
  }

  saveTypeIntervention(data: TypeIntervention): Observable<TypeIntervention> {
    return this.http.post<TypeIntervention>(`${this.url}/type-interventions`, data);
  }

  editTypeIntervention(data: TypeIntervention): Observable<TypeIntervention> {
    return this.http.put<TypeIntervention>(`${this.url}/type-interventions/${data.id}`, data);
  }

  deleteTypeIntervention(data: TypeIntervention): Observable<void> {
    return this.http.delete<void>(`${this.url}/type-interventions/${data.id}`);
  }
}
