import { Injectable } from '@angular/core';
import { Observable} from 'rxjs';

import { HttpClient } from '@angular/common/http';
import {environment} from "../../../../environments/environment";
import { AnnulationTicket, MouvementTicket, CouponTicket, CompagniePetroliere } from "../interface/models";
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AnnulationTicketService  {
  private url: string = environment.backend;

  constructor(private http: HttpClient) {}

  getAllAnnulationTicket(): Observable<AnnulationTicket[]> {
    return this.http.get<{ success: boolean; message: string; data: { data: AnnulationTicket[] } }>(
      `${this.url}/annulation-ticket`
    ).pipe(
      map((response: { success: boolean; message: string; data: { data: AnnulationTicket[] } }) =>
        response.data.data // On récupère uniquement le tableau de RetourTicket
      )
    );
  }

  saveAnnulationTickett(data: AnnulationTicket): Observable<AnnulationTicket> {
    return this.http.post<AnnulationTicket>(`${this.url}/annulation-ticket`, data);
  }

  editAnnulationTicket(data: AnnulationTicket): Observable<AnnulationTicket> {
    return this.http.put<AnnulationTicket>(`${this.url}/annulation-ticket/${data.id}`, data);
  }

  deleteAnnulationTicket(data: AnnulationTicket): Observable<void> {
    return this.http.delete<void>(`${this.url}/annulation-ticket/${data.id}`);
  }

  getAllSortieTicketWhereNotInAnnulation(): Observable<MouvementTicket[]> {
      return this.http.get<{ success: boolean; message: string; data: { data: MouvementTicket[] } }>(
        `${this.url}/mouvement-ticket/getAllSortieTicketWhereNotInRetour`
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

        getQuantiteDisponible(idCoupon: number): Observable<any> {
          return this.http.get<any>(`${this.url}/quantite-disponible-ticket/${idCoupon}`);
        }
}
