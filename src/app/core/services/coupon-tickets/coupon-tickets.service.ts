import { Injectable } from '@angular/core';
import { Observable, of} from 'rxjs';

import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import {environment} from "../../../../environments/environment";
import { CouponTicket, StockTicket,CompagniePetroliere } from "../interface/models";
import { catchError, map, tap } from 'rxjs/operators';

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
  getAllStockTickets(): Observable<StockTicket[]> {
    return this.http.get<{ success: boolean; message: string; data: { data: StockTicket[] } }>(
      `${this.url}/stock_coupon_tickets`
    ).pipe(
      map((response: { success: boolean; message: string; data: { data: StockTicket[] } }) =>
        response.data.data // On récupère uniquement le tableau de StockTicket
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



  saveCouponTicket(data: CouponTicket): Observable<CouponTicket> {
    return this.http.post<CouponTicket>(`${this.url}/coupon_tickets`, data);
  }

  editCouponTicket(data: CouponTicket): Observable<CouponTicket> {
    return this.http.put<CouponTicket>(`${this.url}/coupon_tickets/${data.id}`, data);
  }

  deleteCouponTicket(data: CouponTicket): Observable<void> {
    return this.http.delete<void>(`${this.url}/coupon_tickets/${data.id}`);
  }

  imprimerEtatStockTickets(): Observable<Blob> {
    const printUrl = `${environment.backend}/stock-tickets/imprimer`;
    console.log('Requête PDF pour l\'état de stock des tickets vers:', printUrl);
    return this.http.get(printUrl, { responseType: 'blob' }).pipe(
      tap(() => console.log('PDF de l\'état de stock des tickets reçu avec succès.')),
      catchError(this.handleError<Blob>('imprimerEtatStockTickets'))
    );
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: HttpErrorResponse): Observable<T> => {
      console.error(`${operation} failed:`, error);
      // Retourne un résultat vide ou par défaut pour que l'application continue de fonctionner
      return of(result as T);
    };
  }
}
