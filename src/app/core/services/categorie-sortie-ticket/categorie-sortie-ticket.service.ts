import { Injectable } from '@angular/core';
import { Observable} from 'rxjs';

import { HttpClient } from '@angular/common/http';
import {environment} from "../../../../environments/environment";
import { CategorieSortieTicket } from "../interface/models";
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class CategorieSortieTicketService {
  private url: string = environment.backend;

  constructor(private http: HttpClient) {}

  getAllCategorieSortieTickets(): Observable<CategorieSortieTicket[]> {
    return this.http.get<{ success: boolean; message: string; data: { data: CategorieSortieTicket[] } }>(
      `${this.url}/categorieSortieTicket`
    ).pipe(
      map((response: { success: boolean; message: string; data: { data: CategorieSortieTicket[] } }) =>
        response.data.data // On récupère uniquement le tableau de Marque
      )
    );
  }

  saveCategorieSortieTicket(data: CategorieSortieTicket): Observable<CategorieSortieTicket> {
    return this.http.post<CategorieSortieTicket>(`${this.url}/categorieSortieTicket`, data);
  }

  editCategorieSortieTicket(data: CategorieSortieTicket): Observable<CategorieSortieTicket> {
    return this.http.put<CategorieSortieTicket>(`${this.url}/categorieSortieTicket/${data.id}`, data);
  }

  deleteCategorieSortieTicket(data: CategorieSortieTicket): Observable<void> {
    return this.http.delete<void>(`${this.url}/categorieSortieTicket/${data.id}`);
  }
}
