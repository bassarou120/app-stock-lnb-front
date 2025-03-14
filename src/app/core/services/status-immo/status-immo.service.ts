import { Injectable } from '@angular/core';
import { Observable} from 'rxjs';

import { HttpClient } from '@angular/common/http';
import {environment} from "../../../../environments/environment";
import { StatusImmo } from "../interface/models";
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class StatusImmoService {
  private url: string = environment.backend;

  constructor(private http: HttpClient) {}

  getAllStatusImmos(): Observable<StatusImmo[]> {
    return this.http.get<{ success: boolean; message: string; data: { data: StatusImmo[] } }>(
      `${this.url}/status_immos`
    ).pipe(
      map((response: { success: boolean; message: string; data: { data: StatusImmo[] } }) =>
        response.data.data // On récupère uniquement le tableau de StatusImmo
      )
    );
  }

  saveStatusImmos(data: StatusImmo): Observable<StatusImmo> {
    return this.http.post<StatusImmo>(`${this.url}/status_immos`, data);
  }

  editStatusImmos(data: StatusImmo): Observable<StatusImmo> {
    return this.http.put<StatusImmo>(`${this.url}/status_immos/${data.id}`, data);
  }

  deleteStatusImmos(data: StatusImmo): Observable<void> {
    return this.http.delete<void>(`${this.url}/status_immos/${data.id}`);
  }
}
