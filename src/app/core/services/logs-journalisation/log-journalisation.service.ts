import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from './../../../../environments/environment'; 
// ✅ Chemin corrigé vers le fichier environment.ts (ajustez le nombre de '../' si nécessaire)

// --- INTERFACES ---

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
  getLogs(): Observable<LogJournalisationResponse> {
    return this.http.get<LogJournalisationResponse>(`${this.url}/logs`);
  }
}