import { Injectable } from '@angular/core';
import { Observable} from 'rxjs';

import { HttpClient } from '@angular/common/http';
import {environment} from "../../../../environments/environment";
import { Employe } from "../interface/models";
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class EmployesService {
  private url: string = environment.backend;

  constructor(private http: HttpClient) {}

  getAllEmployes(): Observable<Employe[]> {
    return this.http.get<{ success: boolean; message: string; data: { data: Employe[] } }>(
      `${this.url}/employes`
    ).pipe(
      map((response: { success: boolean; message: string; data: { data: Employe[] } }) => 
        response.data.data // On récupère uniquement le tableau de Employe
      )
    ); 
  }

  saveEmploye(data: Employe): Observable<Employe> {
    return this.http.post<Employe>(`${this.url}/employes`, data);
  }

  editEmploye(data: Employe): Observable<Employe> {
    return this.http.put<Employe>(`${this.url}/employes/${data.id}`, data);
  }

  deleteEmploye(data: Employe): Observable<void> {
    return this.http.delete<void>(`${this.url}/employes/${data.id}`);
  }
}
