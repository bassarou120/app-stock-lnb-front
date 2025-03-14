import { Injectable } from '@angular/core';
import { Observable} from 'rxjs';

import { HttpClient } from '@angular/common/http';
import {environment} from "../../../../environments/environment";
import { TypeMouvement } from "../interface/models";
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class TypeMouvementService {
  private url: string = environment.backend;

  constructor(private http: HttpClient) {}

  getAllTypeMouvement(): Observable<TypeMouvement[]> {
    return this.http.get<{ success: boolean; message: string; data: { data: TypeMouvement[] } }>(
      `${this.url}/type_mouvements`
    ).pipe(
      map((response: { success: boolean; message: string; data: { data: TypeMouvement[] } }) =>
        response.data.data // On récupère uniquement le tableau de Marque
      )
    );
  }

  saveTypeMouvement(data: TypeMouvement): Observable<TypeMouvement> {
    return this.http.post<TypeMouvement>(`${this.url}/type_mouvements`, data);
  }

  editTypeMouvement(data: TypeMouvement): Observable<TypeMouvement> {
    return this.http.put<TypeMouvement>(`${this.url}/type_mouvements/${data.id}`, data);
  }

  deleteTypeMouvement(data: TypeMouvement): Observable<void> {
    return this.http.delete<void>(`${this.url}/type_mouvements/${data.id}`);
  }
}
