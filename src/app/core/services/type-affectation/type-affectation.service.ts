import { Injectable } from '@angular/core';
import { Observable} from 'rxjs';

import { HttpClient } from '@angular/common/http';
import {environment} from "../../../../environments/environment";
import { TypeAffectation } from "../interface/models";
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class TypeAffectationService  {
  private url: string = environment.backend;

  constructor(private http: HttpClient) {}

  getAllTypeAffectations(): Observable<TypeAffectation[]> {
    return this.http.get<{ success: boolean; message: string; data: { data: TypeAffectation[] } }>(
      `${this.url}/type_affectations`
    ).pipe(
      map((response: { success: boolean; message: string; data: { data: TypeAffectation[] } }) =>
        response.data.data // On récupère uniquement le tableau de TypeAffectation
      )
    );
  }

  saveTypeAffectation(data: TypeAffectation): Observable<TypeAffectation> {
    return this.http.post<TypeAffectation>(`${this.url}/type_affectations`, data);
  }

  editTypeAffectation(data: TypeAffectation): Observable<TypeAffectation> {
    return this.http.put<TypeAffectation>(`${this.url}/type_affectations/${data.id}`, data);
  }

  deleteTypeAffectation(data: TypeAffectation): Observable<void> {
    return this.http.delete<void>(`${this.url}/type_affectations/${data.id}`);
  }
}
