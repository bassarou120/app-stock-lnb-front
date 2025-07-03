import { Component, OnInit, OnDestroy, Renderer2, Inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeModeService } from './core/services/theme-mode.service';
import { IdleService } from './core/services/idle/idle.service';
import { environment } from "../environments/environment";
import { HttpClient } from '@angular/common/http';
import { DOCUMENT } from '@angular/common';
import { SiteSettingsService, SiteSettings } from './core/services/site-settings/site-settings.service'; // Importez SiteSettings
import { Subject, takeUntil } from 'rxjs';
import { DynamicThemeService } from './core/services/dynamic-theme/dynamic-theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'demo1';
  private dynamicThemeService = Inject(DynamicThemeService);

  private destroy$ = new Subject<void>();

  constructor(
    private themeModeService: ThemeModeService,
    private idleService: IdleService,
    private http: HttpClient,
    private siteSettingsService: SiteSettingsService, // Injection du service
    private renderer: Renderer2,
    @Inject(DOCUMENT) private document: Document
  ) {}

  ngOnInit(): void {
    this.dynamicThemeService.refreshTheme();
    const isLoggedIn = localStorage.getItem('isLoggedin') === 'true';
    if (isLoggedIn) {
      this.idleService.startWatching();

      const allowedModules = localStorage.getItem('allowedModules');
      if (!allowedModules) {
        console.log('🔄 Rechargement permissions au démarrage app');
        this.loadUserPermissions();
      } else {
        console.log('✅ Permissions déjà présentes au démarrage');
      }
    }

    // Charger les paramètres du site au démarrage de l'application
    this.siteSettingsService.getSettings().subscribe({
      next: () => console.log('AppComponent: Paramètres du site chargés au démarrage.'),
      error: (err) => console.error('AppComponent: Erreur au chargement initial des paramètres du site:', err)
    });

    // S'abonner aux changements de couleur principale et l'appliquer globalement
    this.siteSettingsService.siteSettings$.pipe(
      takeUntil(this.destroy$)
    ).subscribe((settings: SiteSettings) => { // Typage explicite
      const mainColorHex = settings.mainColor;
      const mainColorRgb = this.hexToRgb(mainColorHex);

      // Appliquer les variables CSS de Bootstrap pour la couleur primaire
      // C'est la clé pour que Bootstrap utilise votre couleur dynamique
      this.renderer.setStyle(this.document.documentElement, '--bs-primary', mainColorHex);
      if (mainColorRgb) {
        this.renderer.setStyle(this.document.documentElement, '--bs-primary-rgb', mainColorRgb);
      }

      console.log('AppComponent: Couleur principale appliquée:', mainColorHex, 'RGB:', mainColorRgb);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadUserPermissions(): void {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user.role_id) return;

    this.http.get<any[]>(`${environment.backend}/permissions/role/${user.role_id}`).subscribe({
      next: (permissions: any[]) => {
        const activePermissions = permissions.filter(p => p.is_active === true);

        const allowedModules: string[] = [];
        const allowedFonctionnalites: string[] = [];

        activePermissions.forEach(permission => {
          if (permission.module && permission.module.libelle_module) {
            const moduleName = permission.module.libelle_module;
            if (!allowedModules.includes(moduleName)) {
              allowedModules.push(moduleName);
            }
          }

          if (permission.fonctionnalite && permission.fonctionnalite.libelle_fonctionnalite) {
            const fonctionnaliteName = permission.fonctionnalite.libelle_fonctionnalite;
            if (!allowedFonctionnalites.includes(fonctionnaliteName)) {
              allowedFonctionnalites.push(fonctionnaliteName);
            }
          }
        });

        console.log('🔄 APP - Fonctionnalités extraites:', allowedFonctionnalites);

        localStorage.setItem('permissions', JSON.stringify(activePermissions));
        localStorage.setItem('allowedModules', JSON.stringify(allowedModules));
        localStorage.setItem('allowedFonctionnalites', JSON.stringify(allowedFonctionnalites));

        window.dispatchEvent(new CustomEvent('permissionsLoaded', {
          detail: {
            permissions: activePermissions,
            allowedModules: allowedModules,
            allowedFonctionnalites: allowedFonctionnalites
          }
        }));
      },
      error: (error) => {
        console.error('❌ Erreur rechargement permissions:', error);
      }
    });
  }

  /**
   * Convertit une couleur hexadécimale en chaîne RGB (ex: "255, 0, 0").
   * @param hex La couleur hexadécimale (ex: "#FF0000").
   * @returns La chaîne RGB ou null si le format est invalide.
   */
  private hexToRgb(hex: string): string | null {
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);

    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : null;
  }
}
