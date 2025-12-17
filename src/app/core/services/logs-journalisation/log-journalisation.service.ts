import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from './../../../../environments/environment'; 
// ✅ Chemin corrigé vers le fichier environment.ts (ajustez le nombre de '../' si nécessaire)

// --- INTERFACES ---

// NOUVELLE INTERFACE POUR LES FILTRES
export interface LogFilters {
  action?: string;
  user_id?: number;
  date_debut?: string; // Format attendu : YYYY-MM-DD
  date_fin?: string;   // Format attendu : YYYY-MM-DD
}

export interface LogJournalisation {
    id: number;
    action: string;
    ip_address: string;
    user_agent: string;
    user_id: number | null;
    // AJOUTEZ CETTE PROPRIÉTÉ :
    user_name_full: string | null; // Champ récupéré via la jointure dans le contrôleur PHP
    date_action: string;
    details: string | null;
    created_at: string;
    updated_at: string;
}

export interface LogJournalisationResponse {
  success: boolean;
  total: number;
  data: LogJournalisation[];
}

// --- SERVICE ---

@Injectable({
  providedIn: 'root'
})
export class LogJournalisationService {

  // Utilisation de environment.apiUrl pour la cohérence
  private url: string = environment.backend;

  constructor(private http: HttpClient) { }

  /**
   * Récupère la liste complète des journaux de l'API.
   * Le type de retour est directement Observable<LogJournalisationResponse> car
   * les logs n'ont généralement pas besoin d'être mis en cache via BehaviorSubject.
   */
  getLogs(filters?: LogFilters): Observable<LogJournalisationResponse> { // <-- MODIFICATION DE LA SIGNATURE
  let params = new HttpParams();

  // Construction des paramètres de requête si des filtres sont fournis
  if (filters) {
    Object.keys(filters).forEach(key => {
      const value = filters[key as keyof LogFilters];
      if (value !== undefined && value !== null) {
        params = params.set(key, String(value));
      }
    });
  }
  
  // Envoi de la requête avec les paramètres de filtre
    return this.http.get<LogJournalisationResponse>(`${this.url}/logs`, { params: params });
  }

/**
 * NOUVELLE MÉTHODE : Récupère les logs pour l'exportation/impression.
 * Utilise la même logique de filtre que getLogs, mais appelle le endpoint /logs/export.
 * NOTE: Votre contrôleur PHP a été mis à jour pour ce chemin.
 */
  exportLogs(filters?: LogFilters): Observable<Blob> { // <-- Le type de retour est maintenant Blob
    let params = new HttpParams();

    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = filters[key as keyof LogFilters];
        if (value !== undefined && value !== null) {
          params = params.set(key, String(value));
        }
      });
    }

    // MODIFICATION CLÉ : Ajouter { responseType: 'blob' }
    // Ceci est crucial pour que HttpClient sache qu'il ne doit PAS essayer de parser le JSON
    return this.http.get(`${this.url}/logs/export`, { 
        params: params,
        responseType: 'blob' 
    });
  }
}