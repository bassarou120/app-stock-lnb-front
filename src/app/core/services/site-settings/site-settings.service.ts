import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';

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
    logoUrl: 'assets/images/logo_bg.png',
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
    console.log('SiteSettingsService: Début du chargement des paramètres depuis:', `${this.backendBaseUrl}/api/site-settings`);

    return this.http.get<Setting[]>(`${this.backendBaseUrl}/api/site-settings`).pipe(
      tap(settings => {
        console.log('SiteSettingsService: Données reçues de l\'API:', settings);

        // Recherche des paramètres spécifiques
        const companyNameSetting = settings.find(s => s.key === 'company_name');
        const logoUrlSetting = settings.find(s => s.key === 'logo_url');
        const mainColorSetting = settings.find(s => s.key === 'main_color');

        console.log('SiteSettingsService: Paramètres trouvés:', {
          companyName: companyNameSetting,
          logoUrl: logoUrlSetting,
          mainColor: mainColorSetting
        });

        // Traitement du logo
        const currentLogoPath = logoUrlSetting?.value || null;
        let fullLogoUrl: string;

        if (currentLogoPath) {
          // 💡 CORRECTION : Rétablir l'appel pour pointer vers le backend
          fullLogoUrl = this.getPublicStorageUrl(currentLogoPath);
          console.log('SiteSettingsService: URL du logo générée:', fullLogoUrl); // Doit afficher l'URL complète
      } else {
          // Garder le chemin de secours Angular
          fullLogoUrl = 'assets/images/logo_bg.png';
      }

        // Création de l'objet des paramètres du site
        const siteSettingsData = {
          companyName: companyNameSetting?.value || 'Nom du Site',
          logoUrl: fullLogoUrl,
          mainColor: mainColorSetting?.value || '#00993E'
        };

        console.log('SiteSettingsService: Mise à jour du BehaviorSubject avec:', siteSettingsData);

        // Mise à jour du BehaviorSubject
        this._siteSettings.next(siteSettingsData);

        console.log('SiteSettingsService: BehaviorSubject mis à jour. Valeur actuelle:', this._siteSettings.getValue());
      }),
      // Gestion des erreurs
      catchError(error => {
        console.error('SiteSettingsService: Erreur lors du chargement des paramètres:', error);

        // En cas d'erreur, utiliser les valeurs par défaut
        const defaultSettings = {
          companyName: 'Nom du Site (Erreur de chargement)',
          logoUrl: 'assets/images/logo_bg.png',
          mainColor: '#00993E'
        };

        this._siteSettings.next(defaultSettings);
        console.log('SiteSettingsService: Valeurs par défaut appliquées après erreur');

        // Retourner un tableau vide pour maintenir le type Observable<Setting[]>
        return of([]);
      })
    );
  }

    /**
     * Met à jour un paramètre spécifique du site ou en crée un nouveau.
     * Cette méthode ne déclenche PLUS de rechargement automatique.
     */
    saveSetting(key: string, value: string | null, type: string): Observable<any> {
      const payload = { key, value, type };
      // 🛑 TRÈS IMPORTANT : Supprimez le .pipe(tap(() => { this.getSettings().subscribe(...) }))
      // pour éviter le rechargement automatique après chaque sauvegarde.
      return this.http.post<any>(`${this.backendBaseUrl}/api/site-settings/store`, payload);
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

  /**
     * 💡 NOUVELLE MÉTHODE : Met à jour le BehaviorSubject localement.
     * Utilisé pour diffuser les changements immédiatement après une série de sauvegardes.
     */
  public updateLocalSettings(newSettings: SiteSettings): void {
    console.log('SiteSettingsService: Diffusion locale des nouveaux paramètres:', newSettings);
    this._siteSettings.next(newSettings);
  }
}
