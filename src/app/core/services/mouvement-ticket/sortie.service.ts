import { Injectable } from '@angular/core';
import { Observable} from 'rxjs';

import { HttpClient } from '@angular/common/http';
import {environment} from "../../../../environments/environment";
import { Employe, Vehicule, CouponTicket, TypeMouvement, MouvementTicket, CompagniePetroliere, Commune } from "../interface/models";
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class MouvementTicketService  {
  private url: string = environment.backend;

  constructor(private http: HttpClient) {}

  getAllMouvementTicketSortie(): Observable<MouvementTicket[]> {
    return this.http.get<{ success: boolean; message: string; data: { data: MouvementTicket[] } }>(
      `${this.url}/mouvement-ticket/sortie`
    ).pipe(
      map((response: { success: boolean; message: string; data: { data: MouvementTicket[] } }) =>
        response.data.data // On récupère uniquement le tableau de MouvementTicketSortie
      )
    );
  }

  getQuantiteDisponible(idCoupon: number, idCompagnie: number): Observable<any> {
    return this.http.get<any>(`${this.url}/quantite-disponible-ticket/${idCoupon}/${idCompagnie}`);
  }

  saveMouvementTicketSortie(data: MouvementTicket): Observable<MouvementTicket> {
    return this.http.post<MouvementTicket>(`${this.url}/mouvement-ticket/sortie`, data);
  }
  editMouvementTicketSortie(data: MouvementTicket): Observable<MouvementTicket> {
    return this.http.put<MouvementTicket>(`${this.url}/mouvement-ticket/sortie/${data.id}`, data);
  }


  deleteMouvementTicketSortie(data: MouvementTicket): Observable<void> {
    return this.http.delete<void>(`${this.url}/mouvement-ticket/sortie/${data.id}`);
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
  // getAllCouponTickets(): Observable<CouponTicket[]> {
  //   return this.http.get<{ success: boolean; message: string; data: { data: CouponTicket[] } }>(
  //     `${this.url}/coupon_tickets`
  //   ).pipe(
  //     map((response: { success: boolean; message: string; data: { data: CouponTicket[] } }) =>
  //       response.data.data // On récupère uniquement le tableau de CouponTicket
  //     )
  //   );
  // }

  getCouponTicketsWithCompagnies(): Observable<any> {
    return this.http.get(`${this.url}/stock/coupon-compagnies`);
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
  getAllTypeMouvement(): Observable<TypeMouvement[]> {
    return this.http.get<{ success: boolean; message: string; data: { data: TypeMouvement[] } }>(
      `${this.url}/type_mouvements`
    ).pipe(
      map((response: { success: boolean; message: string; data: { data: TypeMouvement[] } }) =>
        response.data.data // On récupère uniquement le tableau de Marque
      )
    );
  }
  getAllCompagniePetrolieres(): Observable<CompagniePetroliere[]> {
    return this.http.get<{ success: boolean; message: string; data: { data: CompagniePetroliere[] } }>(
      `${this.url}/compagnie_petrolier`
    ).pipe(
      map((response: { success: boolean; message: string; data: { data: CompagniePetroliere[] } }) =>
        response.data.data
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

    getAllCommunes(): Observable<Commune[]> {
      return this.http.get<{ success: boolean; message: string; data: { data: Commune[] } }>(
        `${this.url}/communes`
      ).pipe(
        map((response: { success: boolean; message: string; data: { data: Commune[] } }) =>
          response.data.data // On récupère uniquement le tableau de Commune
        )
      );
    }

    getQuantiteTicketAttribution(data: any): Observable<any> {
      return this.http.post<any>(`${this.url}/get-quantite-ticket-attribution`, data);
    }

}
