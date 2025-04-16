import { Injectable } from '@angular/core';
import { Observable} from 'rxjs';

import { HttpClient } from '@angular/common/http';
import {environment} from "../../../../environments/environment";
import { MouvementTicket, Vehicule, Employe, CompagniePetroliere, CouponTicket } from "../interface/models";
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class MouvementTicketService  {
  private url: string = environment.backend;

  constructor(private http: HttpClient) {}

  getAllMouvementTicketEntree(): Observable<MouvementTicket[]> {
    return this.http.get<{ success: boolean; message: string; data: { data: MouvementTicket[] } }>(
      `${this.url}/mouvement-ticket/entree`
    ).pipe(
      map((response: { success: boolean; message: string; data: { data: MouvementTicket[] } }) =>
        response.data.data // On récupère uniquement le tableau de MouvementStockEntré
      )
    );
  }

  saveMouvementTicketEntree(data: MouvementTicket): Observable<MouvementTicket> {
    return this.http.post<MouvementTicket>(`${this.url}/mouvement-ticket/entree`, data);
  }

  editMouvementTicketEntree(data: MouvementTicket): Observable<MouvementTicket> {
    return this.http.put<MouvementTicket>(`${this.url}/mouvement-ticket/entree/${data.id}`, data);
  }

  deleteMouvementTicketEntree(data: MouvementTicket): Observable<void> {
    return this.http.delete<void>(`${this.url}/mouvement-ticket/entree/${data.id}`);
  }

  getAllVehicules(): Observable<Vehicule[]> {
    return this.http.get<{ success: boolean; message: string; data: { data: Vehicule[] } }>(
      `${this.url}/vehicules`
    ).pipe(
      map((response: { success: boolean; message: string; data: { data: Vehicule[] } }) =>
        response.data.data // On récupère uniquement le tableau de Article
      )
    );
  }

  getAllEmployes(): Observable<Employe[]> {
    return this.http.get<{ success: boolean; message: string; data: { data: Employe[] } }>(
      `${this.url}/employes`
    ).pipe(
      map((response: { success: boolean; message: string; data: { data: Employe[] } }) =>
        response.data.data // On récupère uniquement le tableau de Employe
      )
    );
  }

  getAllCompagniePetrolieres(): Observable<CompagniePetroliere[]> {
    return this.http.get<{ success: boolean; message: string; data: { data: CompagniePetroliere[] } }>(
      `${this.url}/compagnie_petrolier`
    ).pipe(
      map((response: { success: boolean; message: string; data: { data: CompagniePetroliere[] } }) =>
        response.data.data // On récupère uniquement le tableau de CompagniePetroliere
      )
    );
  }

  getAllCouponTickets(): Observable<CouponTicket[]> {
    return this.http.get<{ success: boolean; message: string; data: { data: CouponTicket[] } }>(
      `${this.url}/coupon_tickets`
    ).pipe(
      map((response: { success: boolean; message: string; data: { data: CouponTicket[] } }) =>
        response.data.data // On récupère uniquement le tableau de CouponTicket
      )
    );
  }

}
