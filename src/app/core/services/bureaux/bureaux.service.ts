import { Injectable } from '@angular/core';
import { Observable} from 'rxjs';

import { HttpClient } from '@angular/common/http';
import {environment} from "../../../../environments/environment";
import { Bureau } from "../interface/models";
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class BureauxService  {
  private url: string = environment.backend;

  constructor(private http: HttpClient) {}

  getAllBureaux(): Observable<Bureau[]> {
    return this.http.get<{ success: boolean; message: string; data: { data: Bureau[] } }>(
      `${this.url}/bureaux`
    ).pipe(
      map((response: { success: boolean; message: string; data: { data: Bureau[] } }) =>
        response.data.data // On récupère uniquement le tableau de Bureau
      )
    );
  }

  saveBureau(data: Bureau): Observable<Bureau> {
    return this.http.post<Bureau>(`${this.url}/bureaux`, data);
  }

  editBureau(data: Bureau): Observable<Bureau> {
    return this.http.put<Bureau>(`${this.url}/bureaux/${data.id}`, data);
  }

  deleteBureau(data: Bureau): Observable<void> {
    return this.http.delete<void>(`${this.url}/bureaux/${data.id}`);
  }
}
