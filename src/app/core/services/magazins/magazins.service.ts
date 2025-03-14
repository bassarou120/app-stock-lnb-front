import { Injectable } from '@angular/core';
import { Observable} from 'rxjs';

import { HttpClient } from '@angular/common/http';
import {environment} from "../../../../environments/environment";
import { Magazin } from "../interface/models";
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class MagazinsService {
  private url: string = environment.backend;

  constructor(private http: HttpClient) {}

  getAllMagazins(): Observable<Magazin[]> {
    return this.http.get<{ success: boolean; message: string; data: { data: Magazin[] } }>(
      `${this.url}/magazins`
    ).pipe(
      map((response: { success: boolean; message: string; data: { data: Magazin[] } }) =>
        response.data.data // On récupère uniquement le tableau de Magazin
      )
    );
  }

  saveMagazin(data: Magazin): Observable<Magazin> {
    return this.http.post<Magazin>(`${this.url}/magazins`, data);
  }

  editMagazin(data: Magazin): Observable<Magazin> {
    return this.http.put<Magazin>(`${this.url}/magazins/${data.id}`, data);
  }

  deleteMagazin(data: Magazin): Observable<void> {
    return this.http.delete<void>(`${this.url}/magazins/${data.id}`);
  }
}
