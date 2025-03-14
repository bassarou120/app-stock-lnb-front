import { Injectable } from '@angular/core';
import { Observable} from 'rxjs';

import { HttpClient } from '@angular/common/http';
import {environment} from "../../../../environments/environment";
import { TypeImmo } from "../interface/models";
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class TypeImmoService  {
  private url: string = environment.backend;

  constructor(private http: HttpClient) {}

  getAllTypeImmos(): Observable<TypeImmo[]> {
    return this.http.get<{ success: boolean; message: string; data: { data: TypeImmo[] } }>(
      `${this.url}/type_immos`
    ).pipe(
      map((response: { success: boolean; message: string; data: { data: TypeImmo[] } }) =>
        response.data.data // On récupère uniquement le tableau de TypeImmo
      )
    );
  }

  saveTypeImmo(data: TypeImmo): Observable<TypeImmo> {
    return this.http.post<TypeImmo>(`${this.url}/type_immos`, data);
  }

  editTypeImmo(data: TypeImmo): Observable<TypeImmo> {
    return this.http.put<TypeImmo>(`${this.url}/type_immos/${data.id}`, data);
  }

  deleteTypeImmo(data: TypeImmo): Observable<void> {
    return this.http.delete<void>(`${this.url}/type_immos/${data.id}`);
  }
}
