import { Injectable } from '@angular/core';
import { Observable} from 'rxjs';

import { HttpClient } from '@angular/common/http';
import {environment} from "../../../../environments/environment";
import { Commune } from "../interface/models";
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class CommunesService {
  private url: string = environment.backend;

  constructor(private http: HttpClient) {}

  getAllCommunes(): Observable<Commune[]> {
    return this.http.get<{ success: boolean; message: string; data: { data: Commune[] } }>(
      `${this.url}/communes`
    ).pipe(
      map((response: { success: boolean; message: string; data: { data: Commune[] } }) => 
        response.data.data // On récupère uniquement le tableau de communes
      )
    ); 
  }

  saveCommune(data: Commune): Observable<Commune> {
    return this.http.post<Commune>(`${this.url}/communes`, data);
  }

  editCommune(data: Commune): Observable<Commune> {
    return this.http.put<Commune>(`${this.url}/communes/${data.id}`, data);
  }

  deleteCommune(data: Commune): Observable<void> {
    return this.http.delete<void>(`${this.url}/communes/${data.id}`);
  }
}
