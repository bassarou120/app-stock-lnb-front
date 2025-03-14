import { Injectable } from '@angular/core';
import { Observable} from 'rxjs';

import { HttpClient } from '@angular/common/http';
import {environment} from "../../../../environments/environment";
import { SousTypeImmo, TypeImmo } from "../interface/models";
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class SousTypeImmoService  {
  private url: string = environment.backend;

  constructor(private http: HttpClient) {}

  getAllSousTypeImmos(): Observable<SousTypeImmo[]> {
    return this.http.get<{ success: boolean; message: string; data: { data: SousTypeImmo[] } }>(
      `${this.url}/sous_type_immos`
    ).pipe(
      map((response: { success: boolean; message: string; data: { data: SousTypeImmo[] } }) =>
        response.data.data // On récupère uniquement le tableau de SousTypeImmo
      )
    );
  }

  saveSousTypeImmo(data: SousTypeImmo): Observable<SousTypeImmo> {
    return this.http.post<SousTypeImmo>(`${this.url}/sous_type_immos`, data);
  }

  editSousTypeImmo(data: SousTypeImmo): Observable<SousTypeImmo> {
    return this.http.put<SousTypeImmo>(`${this.url}/sous_type_immos/${data.id}`, data);
  }

  deleteSousTypeImmo(data: SousTypeImmo): Observable<void> {
    return this.http.delete<void>(`${this.url}/sous_type_immos/${data.id}`);
  }

  getAllTypeImmos(): Observable<TypeImmo[]> {
      return this.http.get<{ success: boolean; message: string; data: { data: TypeImmo[] } }>(
        `${this.url}/type_immos`
      ).pipe(
        map((response: { success: boolean; message: string; data: { data: TypeImmo[] } }) =>
          response.data.data // On récupère uniquement le tableau de TypeImmo
        )
      );
    }
}
