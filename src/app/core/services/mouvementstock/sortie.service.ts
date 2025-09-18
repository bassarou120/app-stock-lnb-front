import { Injectable } from '@angular/core';
import { Observable, of} from 'rxjs';

import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import {environment} from "../../../../environments/environment";
import { MouvementStock, Article, Bureau, Employe, MouvementStockGrouped } from "../interface/models";
import { catchError, map, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class MouvementStockService  {
  private url: string = environment.backend;

  constructor(private http: HttpClient) {}



  getSortieStockGrouped(): Observable<{ success: boolean; message: string; data: MouvementStockGrouped[] }> {
    return this.http.get<{ success: boolean; message: string; data: MouvementStockGrouped[] }>(`${this.url}/mouvement-stock/sortie/indexSortieStockGrouped`);
  }

  getAllMouvementStockSortie(): Observable<MouvementStock[]> {
    return this.http.get<{ success: boolean; message: string; data: { data: MouvementStock[] } }>(
      `${this.url}/mouvement-stock/sortie`
    ).pipe(
      map((response: { success: boolean; message: string; data: { data: MouvementStock[] } }) =>
        response.data.data // On récupère uniquement le tableau de MouvementStockSortie
      )
    );
  }

  getQuantiteDisponible(idArticle: number): Observable<any> {
    return this.http.get<any>(`${this.url}/quantite-disponible/${idArticle}`);
  }


  saveMouvementStockSortie(data: MouvementStock): Observable<MouvementStock> {
    return this.http.post<MouvementStock>(`${this.url}/mouvement-stock/sortie`, data);
  }
  editMouvementStockSortie(data: MouvementStock): Observable<MouvementStock> {
    return this.http.put<MouvementStock>(`${this.url}/mouvement-stock/sortie/${data.id}`, data);
  }


  deleteMouvementStockSortie(data: MouvementStock): Observable<void> {
    return this.http.delete<void>(`${this.url}/mouvement-stock/sortie/${data.id}`);
  }

  getAllArticles(): Observable<Article[]> {
    return this.http.get<{ success: boolean; message: string; data: { data: Article[] } }>(
      `${this.url}/articles`
    ).pipe(
      map((response: { success: boolean; message: string; data: { data: Article[] } }) =>
        response.data.data // On récupère uniquement le tableau de Article
      )
    );
  }
  getAllBureaux(): Observable<Bureau[]> {
    return this.http.get<{ success: boolean; message: string; data: { data: Bureau[] } }>(
      `${this.url}/bureaux`
    ).pipe(
      map((response: { success: boolean; message: string; data: { data: Bureau[] } }) =>
        response.data.data // On récupère uniquement le tableau de Bureau
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

    imprimerMouvementsSortie(): Observable<Blob> {
      const printUrl = `${this.url}/imprimerSorties`; // L'URL de ton endpoint Laravel pour l'impression
      console.log('Requête PDF pour les mouvements de sortie vers:', printUrl);
      return this.http.get(printUrl, { responseType: 'blob' }).pipe(
        tap(() => console.log('PDF des mouvements de sortie reçu.')),
        catchError(this.handleError<Blob>('imprimerMouvementsSortie'))
      );
    }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: HttpErrorResponse): Observable<T> => {
      console.error(`${operation} failed:`, error);
      // Retourne un résultat vide ou par défaut pour que l'application continue de fonctionner
      return of(result as T);
    };
  }

  // **Ajout de la méthode pour mettre à jour le statut :**
  updateDemandeStock(id: number, data: { statut: string }): Observable<any> {
    return this.http.patch<any>(`${this.url}/mouvement-stock/sortie/${id}`, data);
  }
  validerDemandeGroupee(data: { statut: string }): Observable<any> {
    return this.http.post<any>(`${this.url}/mouvement-stock/demande-sortie/tout-valider`, data);
  }

  genererFichePDF(id: number): Observable<Blob> {
    const url = `${this.url}/mouvements/fiche/${id}`;
    // L'option { responseType: 'blob' } est cruciale pour que le navigateur gère la réponse comme un fichier binaire.
    return this.http.get(url, { responseType: 'blob' });
  }

  verifieStatus(code: string): Observable<Blob>  {
    return this.http.get<any>(`${this.url}/mouvements/demande-sortie/check-status-and-generate/${code}`);
  }


//
//   // Vérifie le statut uniquement (retour JSON attendu)
//   verifieStatus2(code: string): Observable<any> {
//     return this.http.get<any>(`${this.url}/mouvements/demande-sortie/check-status/${code}`);
//   }
//
// // Génère et retourne le PDF groupé
//   downloadGroupedFile2(code_mouvement: string): Observable<Blob> {
//     const url = `${this.url}/mouvements/demande-sortie/check-status-and-generate/${encodeURIComponent(code_mouvement)}`;
//     return this.http.get(url, { responseType: 'blob' });
//   }
//




  genererFicheGroupeePDF(codeMouvement: string): Observable<Blob> {
    const url = `${this.url}/mouvements/groupe/pdf/${codeMouvement}`;
    // Utilisez l'option { responseType: 'blob' } pour les fichiers binaires
    return this.http.get(url, { responseType: 'blob' });
  }




  uploadSignedFile(formData: FormData): Observable<any> {
    return this.http.post<any>(`${this.url}/demande/valid-upload-signe`, formData);
  }

   getFile(idfichier: string): void {
    const fullUrl = `${this.url}/view-file?idfichier=${encodeURIComponent(idfichier)}`;
    window.open(fullUrl, '_blank');
  }

  downloadGroupedFile(code_mouvement: string): void {
    const fullUrl = `${this.url}/download-grouped-file/${encodeURIComponent(code_mouvement)}`;
    window.open(fullUrl, '_blank');
  }





}
