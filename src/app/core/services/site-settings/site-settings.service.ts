import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';

// Définition de l'interface pour un paramètre individuel stocké en DB
interface Setting {
  id?: number;
  key: string;
  value: string | null;
  type: string;
  created_at?: string;
  updated_at?: string;
}

// Définition de l'interface pour les paramètres du site regroupés pour le frontend
export interface SiteSettings { // EXPORTÉ pour être utilisable dans d'autres composants
  companyName: string;
  logoUrl: string; // URL complète du logo pour affichage dans le frontend
  mainColor: string;
}

@Injectable({
  providedIn: 'root' // CECI EST CRUCIAL pour que le service soit disponible partout
})
export class SiteSettingsService {
  private backendBaseUrl = 'http://localhost:8000'; // <--- VÉRIFIEZ ET METTEZ À JOUR CETTE URL

  // BehaviorSubject pour stocker et diffuser les paramètres du site
  private _siteSettings = new BehaviorSubject<SiteSettings>({
    companyName: 'Nom du Site',
    logoUrl: 'https://placehold.co/100x100/A0B3C8/FFFFFF?text=Logo',
    mainColor: '#00993E' // Vert par défaut
  });

  // Observable public pour que les composants puissent s'abonner aux paramètres mis à jour
  public readonly siteSettings$: Observable<SiteSettings> = this._siteSettings.asObservable();

  constructor(private http: HttpClient) { }

  /**
   * Récupère tous les paramètres du site depuis l'API Laravel.
   * Traite les données et met à jour le BehaviorSubject.
   * @returns Observable<Setting[]> Un tableau des paramètres bruts du site.
   */
  getSettings(): Observable<Setting[]> {
    return this.http.get<Setting[]>(`${this.backendBaseUrl}/api/site-settings`).pipe(
      tap(settings => {
        const companyNameSetting = settings.find(s => s.key === 'company_name');
        const logoUrlSetting = settings.find(s => s.key === 'logo_url');
        const mainColorSetting = settings.find(s => s.key === 'main_color');

        const currentLogoPath = logoUrlSetting?.value || null;
        const fullLogoUrl = currentLogoPath ? this.getPublicStorageUrl(currentLogoPath) : 'https://placehold.co/100x100/A0B3C8/FFFFFF?text=Logo';

        this._siteSettings.next({
          companyName: companyNameSetting?.value || 'Nom du Site',
          logoUrl: fullLogoUrl,
          mainColor: mainColorSetting?.value || '#00993E'
        });
        console.log('SiteSettingsService: Paramètres mis à jour dans BehaviorSubject', this._siteSettings.getValue());
      })
    );
  }

  /**
   * Met à jour un paramètre spécifique du site ou en crée un nouveau.
   * Après un enregistrement réussi, déclenche un rechargement des paramètres pour mettre à jour le BehaviorSubject
   * et notifier tous les abonnés.
   * @param key La clé du paramètre (ex: 'company_name', 'logo_url').
   * @param value La valeur du paramètre (texte, URL d'image, ou Base64 pour le logo).
   * @param type Le type du paramètre (ex: 'text', 'image_url', 'base64_image').
   * @returns Observable<Setting> Le paramètre mis à jour ou créé.
   */
  saveSetting(key: string, value: string | null, type: string): Observable<Setting> {
    const payload = { key, value, type };
    return this.http.post<Setting>(`${this.backendBaseUrl}/api/site-settings/store`, payload).pipe(
      tap(() => {
        this.getSettings().subscribe({
          next: () => console.log('SiteSettingsService: Rechargement des paramètres après sauvegarde.'),
          error: (err) => console.error('SiteSettingsService: Erreur lors du rechargement après sauvegarde:', err)
        });
      })
    );
  }

  /**
   * Construit l'URL complète pour un fichier stocké publiquement par Laravel.
   * @param relativePath Le chemin relatif du fichier (ex: 'logos/mon_logo.png').
   * @returns L'URL complète du fichier.
   */
  getPublicStorageUrl(relativePath: string): string {
    const cleanedPath = relativePath.startsWith('/') ? relativePath.substring(1) : relativePath;
    return `${this.backendBaseUrl}/storage/${cleanedPath}`;
  }
}
