import { Injectable } from '@angular/core';
import { Observable} from 'rxjs';

import { HttpClient } from '@angular/common/http';
import {environment} from "../../../../environments/environment";
import { CouponTicket } from "../interface/models";
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class CouponTicketService  {
  private url: string = environment.backend;

  constructor(private http: HttpClient) {}

  getAllCouponTickets(): Observable<CouponTicket[]> {
    return this.http.get<{ success: boolean; message: string; data: { data: CouponTicket[] } }>(
      `${this.url}/coupon_tickets`
    ).pipe(
      map((response: { success: boolean; message: string; data: { data: CouponTicket[] } }) => 
        response.data.data // On récupère uniquement le tableau de CouponTicket
      )
    ); 
  }

  saveCouponTicket(data: CouponTicket): Observable<CouponTicket> {
    return this.http.post<CouponTicket>(`${this.url}/coupon_tickets`, data);
  }

  editCouponTicket(data: CouponTicket): Observable<CouponTicket> {
    return this.http.put<CouponTicket>(`${this.url}/coupon_tickets/${data.id}`, data);
  }

  deleteCouponTicket(data: CouponTicket): Observable<void> {
    return this.http.delete<void>(`${this.url}/coupon_tickets/${data.id}`);
  }
}
