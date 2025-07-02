import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

interface Setting {
  id?: number;
  key: string;
  value: string | null;
  type: string;
  created_at?: string;
  updated_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SiteSettingsService {
  // IMPORTANT: Mettez à jour cette URL avec l'URL de base de votre application Laravel
  // Par exemple: 'http://localhost:8000' ou 'https://votre-domaine.com'
  private backendBaseUrl = 'http://localhost:8000'; // <--- À METTRE À JOUR

  constructor(private http: HttpClient) { }

  /**
   * Récupère tous les paramètres du site depuis l'API Laravel.
   * @returns Observable<Setting[]> Un tableau des paramètres du site.
   */
  getSettings(): Observable<Setting[]> {
    return this.http.get<Setting[]>(`${this.backendBaseUrl}/api/site-settings`);
  }

  /**
   * Met à jour un paramètre spécifique du site ou en crée un nouveau.
   * @param key La clé du paramètre (ex: 'company_name', 'logo_url').
   * @param value La valeur du paramètre (texte, URL d'image, ou Base64 pour le logo).
   * @param type Le type du paramètre (ex: 'text', 'image_url', 'base64_image').
   * @returns Observable<Setting> Le paramètre mis à jour ou créé.
   */
  saveSetting(key: string, value: string | null, type: string): Observable<Setting> {
    const payload = { key, value, type };
    return this.http.post<Setting>(`${this.backendBaseUrl}/api/site-settings/store`, payload);
  }

  /**
   * Construit l'URL complète pour un fichier stocké publiquement par Laravel.
   * @param relativePath Le chemin relatif du fichier (ex: 'logos/mon_logo.png').
   * @returns L'URL complète du fichier.
   */
  getPublicStorageUrl(relativePath: string): string {
    return `${this.backendBaseUrl}/storage/${relativePath}`;
  }
}
