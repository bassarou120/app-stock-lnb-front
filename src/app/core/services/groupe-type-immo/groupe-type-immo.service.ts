import { Injectable } from '@angular/core';
import { Observable} from 'rxjs';

import { HttpClient } from '@angular/common/http';
import {environment} from "../../../../environments/environment";
import { SousTypeImmo, GroupeTypeImmo } from "../interface/models";
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class GroupeTypeImmoService  {
  private url: string = environment.backend;

  constructor(private http: HttpClient) {}

  getAllGroupeTypeImmos(): Observable<GroupeTypeImmo[]> {
    return this.http.get<{ success: boolean; message: string; data: { data: GroupeTypeImmo[] } }>(
      `${this.url}/groupe_type_immos`
    ).pipe(
      map((response: { success: boolean; message: string; data: { data: GroupeTypeImmo[] } }) =>
        response.data.data // On récupère uniquement le tableau de groupe_type_immos
      )
    );
  }

  saveGroupeTypeImmo(data: GroupeTypeImmo): Observable<GroupeTypeImmo> {
    return this.http.post<GroupeTypeImmo>(`${this.url}/groupe_type_immos`, data);
  }

  editGroupeTypeImmo(data: GroupeTypeImmo): Observable<GroupeTypeImmo> {
    return this.http.put<GroupeTypeImmo>(`${this.url}/groupe_type_immos/${data.id}`, data);
  }

  deleteGroupeTypeImmo(data: GroupeTypeImmo): Observable<void> {
    return this.http.delete<void>(`${this.url}/groupe_type_immos/${data.id}`);
  }

  getAllSousTypeImmos(): Observable<SousTypeImmo[]> {
      return this.http.get<{ success: boolean; message: string; data: { data: SousTypeImmo[] } }>(
        `${this.url}/sous_type_immos`
      ).pipe(
        map((response: { success: boolean; message: string; data: { data: SousTypeImmo[] } }) =>
          response.data.data // On récupère uniquement le tableau de SousTypeImmo
        )
      );
    }
}
