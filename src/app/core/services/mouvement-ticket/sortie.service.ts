import { Injectable } from '@angular/core';
import { Observable} from 'rxjs';

import { HttpClient, HttpHeaders } from '@angular/common/http';
import {environment} from "../../../../environments/environment";
import { Employe, Vehicule, CouponTicket, TypeMouvement, MouvementTicket, CompagniePetroliere, Commune , TransactionSortie} from "../interface/models";
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class MouvementTicketService  {
  private url: string = environment.backend;
  private apiUrl = 'http://127.0.0.1:8000/api/mouvement-tickets'; 

  constructor(private http: HttpClient) {}

  // getAllMouvementTicketSortie(): Observable<MouvementTicket[]> {
  //   return this.http.get<{ success: boolean; message: string; data: { data: MouvementTicket[] } }>(
  //     `${this.url}/mouvement-ticket/sortie`
  //   ).pipe(
  //     map((response: { success: boolean; message: string; data: { data: MouvementTicket[] } }) =>
  //       response.data.data
  //     )
  //   );
  // }
  // getAllMouvementTicketSortie(): Observable<TransactionSortie[]> {
  //   return this.http.get<{ success: boolean; message: string; data: { data: TransactionSortie[] } }>(
  //     `${this.url}/mouvement-ticket/sortie`
  //   ).pipe(
  //     map((response: { success: boolean; message: string; data: { data: TransactionSortie[] } }) =>
  //       response.data.data
  //     )
  //   );
  // }
  getAllMouvementTicketSortie(): Observable<TransactionSortie[]> {
  return this.http
    .get<{ success: boolean; message: string; data: TransactionSortie[] }>(
      `${this.url}/mouvement-ticket/sortie`
    )
    .pipe(
      map((response) => response.data) // <-- juste response.data
    );
}


  getQuantiteDisponible(idCoupon: number, idCompagnie: number): Observable<any> {
    return this.http.get<any>(`${this.url}/quantite-disponible-ticket/${idCoupon}/${idCompagnie}`);
  }

  saveMouvementTicketSortie(data: MouvementTicket): Observable<MouvementTicket> {
    return this.http.post<MouvementTicket>(`${this.url}/mouvement-ticket/sortie`, data);
  }

  // 🛠️ Méthode corrigée pour accepter l'ID et les données
  editMouvementTicketSortie(id: number | null, data: MouvementTicket): Observable<MouvementTicket> {
    // Si la logique backend est déjà de gérer l'URL avec l'ID dans les données, 
    // cette ligne est une bonne pratique de sécurité côté front-end.
    if (id === null || id === undefined) {
      // Optionnel : Lancer une erreur ou retourner un Observable d'erreur
      throw new Error("L'ID est requis pour la modification d'un ticket de sortie.");
    }
    return this.http.put<MouvementTicket>(`${this.url}/mouvement-ticket/sortie/${id}`, data);
  }


  deleteMouvementTicketSortie(data: MouvementTicket): Observable<void> {
    return this.http.delete<void>(`${this.url}/mouvement-ticket/sortie/${data.id}`);
  }

  getAllVehicules(): Observable<Vehicule[]> {
    return this.http.get<{ success: boolean; message: string; data: { data: Vehicule[] } }>(
      `${this.url}/vehicules`
    ).pipe(
      map((response: { success: boolean; message: string; data: { data: Vehicule[] } }) =>
        response.data.data
      )
    );
  }

  getCouponTicketsWithCompagnies(): Observable<any> {
    return this.http.get(`${this.url}/stock/coupon-compagnies`);
  }


  getAllCouponTickets(): Observable<CouponTicket[]> {
    return this.http.get<{ success: boolean; message: string; data: { data: CouponTicket[] } }>(
      `${this.url}/coupon_tickets`
    ).pipe(
      map((response: { success: boolean; message: string; data: { data: CouponTicket[] } }) =>
        response.data.data
      )
    );
  }
  getAllTypeMouvement(): Observable<TypeMouvement[]> {
    return this.http.get<{ success: boolean; message: string; data: { data: TypeMouvement[] } }>(
      `${this.url}/type_mouvements`
    ).pipe(
      map((response: { success: boolean; message: string; data: { data: TypeMouvement[] } }) =>
        response.data.data
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
          response.data.data
        )
      );
    }

    getAllCommunes(): Observable<Commune[]> {
      return this.http.get<{ success: boolean; message: string; data: { data: Commune[] } }>(
        `${this.url}/communes`
      ).pipe(
        map((response: { success: boolean; message: string; data: { data: Commune[] } }) =>
          response.data.data
        )
      );
    }

    genererBonDeSortie(reference: string): Observable<Blob> {
      const headers = new HttpHeaders().set('Accept', 'application/pdf');
      // La ligne corrigée est ici
      return this.http.get(`${this.apiUrl}/generer-bon/${reference}`, {
        headers: headers,
        responseType: 'blob'
      });
    }

    getQuantiteTicketAttribution(data: any): Observable<any> {
      return this.http.post<any>(`${this.url}/get-quantite-ticket-attribution`, data);
    }

    // NOUVELLE MÉTHODE POUR CRÉER UN TRAJET
    createTrajet(trajetData: any): Observable<any> {
      return this.http.post<any>(`${this.url}/trajets`, trajetData);
    }

    updateKilometrageDeFin(mouvementId: number, data: any): Observable<any> {
  return this.http.put(`${this.url}/mouvement-tickets/${mouvementId}/kilometrage-fin`, data);
}

}
