import { Injectable } from '@angular/core';
import { Observable} from 'rxjs';

import { HttpClient } from '@angular/common/http';
import {environment} from "../../../../environments/environment";
import { RetourTicket, MouvementTicket, CouponTicket, CompagniePetroliere } from "../interface/models";
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class RetourTicketService  {
  private url: string = environment.backend;

  constructor(private http: HttpClient) {}

  getAllRetourTickets(): Observable<RetourTicket[]> {
    return this.http.get<{ success: boolean; message: string; data: { data: RetourTicket[] } }>(
      `${this.url}/retour-ticket`
    ).pipe(
      map((response: { success: boolean; message: string; data: { data: RetourTicket[] } }) =>
        response.data.data // On récupère uniquement le tableau de RetourTicket
      )
    );
  }

  saveRetourTicket(data: RetourTicket): Observable<RetourTicket> {
    return this.http.post<RetourTicket>(`${this.url}/retour-ticket`, data);
  }

  editRetourTicket(data: RetourTicket): Observable<RetourTicket> {
    return this.http.put<RetourTicket>(`${this.url}/retour-ticket/${data.id}`, data);
  }

  deleteRetourTicket(data: RetourTicket): Observable<void> {
    return this.http.delete<void>(`${this.url}/retour-ticket/${data.id}`);
  }

  getAllMouvementTicketSortie(): Observable<MouvementTicket[]> {
      return this.http.get<{ success: boolean; message: string; data: { data: MouvementTicket[] } }>(
        `${this.url}/mouvement-ticket/sortie`
      ).pipe(
        map((response: { success: boolean; message: string; data: { data: MouvementTicket[] } }) =>
          response.data.data // On récupère uniquement le tableau de MouvementTicketSortie
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

      getAllCompagniePetrolieres(): Observable<CompagniePetroliere[]> {
          return this.http.get<{ success: boolean; message: string; data: { data: CompagniePetroliere[] } }>(
            `${this.url}/compagnie_petrolier`
          ).pipe(
            map((response: { success: boolean; message: string; data: { data: CompagniePetroliere[] } }) =>
              response.data.data // On récupère uniquement le tableau de CompagniePetroliere
            )
          );
        }

        getMouvementInfo(idMouvement: number): Observable<any> {
          return this.http.get<any>(`${this.url}/mouvement-info/${idMouvement}`);
        }
}
