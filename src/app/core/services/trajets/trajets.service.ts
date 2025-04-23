import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { HttpClient } from '@angular/common/http';
import { environment } from "../../../../environments/environment";
import { Commune, MouvementTicket, Trajet, TypeMouvement} from "../interface/models";
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class TrajetsService {
  private url: string = environment.backend;

  constructor(private http: HttpClient) { }

  getAllTrajet(): Observable<Trajet[]> {
    return this.http.get<{ success: boolean; message: string; data: { data: Trajet[] } }>(
      `${this.url}/trajets`
    ).pipe(
      map((response: { success: boolean; message: string; data: { data: Trajet[] } }) =>
        response.data.data // On récupère uniquement le tableau des Trajets
      )
    );
  }

  saveTrajet(data: Trajet): Observable<Trajet> {
    return this.http.post<Trajet>(`${this.url}/trajets`, data);
  }

  editTrajet(data: Trajet): Observable<Trajet> {
    return this.http.put<Trajet>(`${this.url}/trajets/${data.id}`, data);
  }

  deleteTrajet(data: Trajet): Observable<void> {
    return this.http.delete<void>(`${this.url}/trajets/${data.id}`);
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

  // getAllTypeMouvement(): Observable<TypeMouvement[]> {
  //   return this.http.get<{ success: boolean; message: string; data: { data: TypeMouvement[] } }>(
  //     `${this.url}/type_mouvements`
  //   ).pipe(
  //     map((response: { success: boolean; message: string; data: { data: TypeMouvement[] } }) =>
  //       response.data.data // On récupère uniquement le tableau de Marque
  //     )
  //   );
  // }

  getAllCommunes(): Observable<Commune[]> {
    return this.http.get<{ success: boolean; message: string; data: { data: Commune[] } }>(
      `${this.url}/communes`
    ).pipe(
      map((response: { success: boolean; message: string; data: { data: Commune[] } }) =>
        response.data.data // On récupère uniquement le tableau de Commune
      )
    );
  }
  

  // getAllEmployes(): Observable<Employe[]> {
  //     return this.http.get<{ success: boolean; message: string; data: { data: Employe[] } }>(
  //       `${this.url}/employes`
  //     ).pipe(
  //       map((response: { success: boolean; message: string; data: { data: Employe[] } }) =>
  //         response.data.data // On récupère uniquement le tableau de Employe
  //       )
  //     );
  //   }

  //   getAllImmobilisations(): Observable<Immobilisation[]> {
  //       return this.http.get<{ success: boolean; message: string; data: { data: Immobilisation[] } }>(
  //         `${this.url}/immobilisations`
  //       ).pipe(
  //         map((response: { success: boolean; message: string; data: { data: Immobilisation[] } }) =>
  //           response.data.data // On récupère uniquement le tableau de Immobilisation
  //         )
  //       );
  //     }
  //     
  //       getOldInfo(idImmo: number): Observable<any> {
  //         return this.http.get<any>(`${this.url}/ancien-info/${idImmo}`);
  //       }



}
