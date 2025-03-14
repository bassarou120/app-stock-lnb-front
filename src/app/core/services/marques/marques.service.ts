import { Injectable } from '@angular/core';
import { Observable} from 'rxjs';

import { HttpClient } from '@angular/common/http';
import {environment} from "../../../../environments/environment";
import { Marque } from "../interface/models";
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class MarquesService {
  private url: string = environment.backend;

  constructor(private http: HttpClient) {}

  getAllMarques(): Observable<Marque[]> {
    return this.http.get<{ success: boolean; message: string; data: { data: Marque[] } }>(
      `${this.url}/marques`
    ).pipe(
      map((response: { success: boolean; message: string; data: { data: Marque[] } }) =>
        response.data.data // On récupère uniquement le tableau de Marque
      )
    );
  }

  saveMarque(data: Marque): Observable<Marque> {
    return this.http.post<Marque>(`${this.url}/marques`, data);
  }

  editMarque(data: Marque): Observable<Marque> {
    return this.http.put<Marque>(`${this.url}/marques/${data.id}`, data);
  }

  deleteMarque(data: Marque): Observable<void> {
    return this.http.delete<void>(`${this.url}/marques/${data.id}`);
  }
}
