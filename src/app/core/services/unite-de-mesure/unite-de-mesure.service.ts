import { Injectable } from '@angular/core';
import { Observable} from 'rxjs';

import { HttpClient } from '@angular/common/http';
import {environment} from "../../../../environments/environment";
import { UniteDeMesure } from "../interface/models";
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class UniteDeMesureService  {
  private url: string = environment.backend;

  constructor(private http: HttpClient) {}

  getAllUniteDeMesure(): Observable<UniteDeMesure[]> {
    return this.http.get<{ success: boolean; message: string; data: { data: UniteDeMesure[] } }>(
      `${this.url}/unite-de-mesure`
    ).pipe(
      map((response: { success: boolean; message: string; data: { data: UniteDeMesure[] } }) =>
        response.data.data // On récupère uniquement le tableau de UniteDeMesure
      )
    );
  }

  saveUniteDeMesure(data: UniteDeMesure): Observable<UniteDeMesure> {
    return this.http.post<UniteDeMesure>(`${this.url}/unite-de-mesure`, data);
  }

  editUniteDeMesure(data: UniteDeMesure): Observable<UniteDeMesure> {
    return this.http.put<UniteDeMesure>(`${this.url}/unite-de-mesure/${data.id}`, data);
  }

  deleteUniteDeMesure(data: UniteDeMesure): Observable<void> {
    return this.http.delete<void>(`${this.url}/unite-de-mesure/${data.id}`);
  }
}
