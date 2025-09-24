import { Injectable } from '@angular/core';
import { Observable} from 'rxjs';

import { HttpClient } from '@angular/common/http';
import {environment} from "../../../../environments/environment";
import { MouvementTicket, Vehicule, Employe, CompagniePetroliere, CouponTicket, RapportMensuel } from "../interface/models";
import { map } from 'rxjs/operators';


@Injectable({
  providedIn: 'root',
})

export class MouvementTicketService  {
  private url: string = environment.backend;

  constructor(private http: HttpClient) {}

/*    getRapportPeriodique(annee: number, periode: string): Observable<RapportMensuel[]> {
    const body = { annee, periode };
    return this.http.post<{ success: boolean; message: string; data: { data: RapportMensuel[] } }>(
      `${this.url}/rapport-periodique`,
      body
    ).pipe(
      map(response => response.data.data)
    );
  }  */

  getRapportPeriodique(annee: number, periode: string): Observable<RapportMensuel[]> {
    const body = { annee, periode };
    return this.http.post<{ success: boolean; message: string; data: RapportMensuel[] }>(
      `${this.url}/rapport-periodique`,
      body
    ).pipe(
      map(response => response.data) // 
    );
  } 

}
