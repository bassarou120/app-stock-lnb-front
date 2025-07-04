import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from "../../../../environments/environment";


export interface ThemeColors {
  primary_color: string;
  secondary_color: string;
  success_color: string;
  danger_color: string;
  warning_color: string;
  info_color: string;
  dark_color: string;
  light_color: string;
}

@Injectable({
  providedIn: 'root'
})
export class DynamicThemeService {
  private url: string = environment.backend; // Utilisez 'backend' au lieu de 'apiUrl'
  private colorsSubject = new BehaviorSubject<ThemeColors | null>(null);
  public colors$ = this.colorsSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadThemeColors();
  }

  /**
   * Charge les couleurs depuis l'API
   */
  loadThemeColors(): void {
    this.http.get<ThemeColors>(`${this.url}/site-settings/theme-colors`).subscribe({
      next: (colors) => {
        console.log('🎨 Couleurs chargées depuis l\'API:', colors);
        this.colorsSubject.next(colors);
        this.applyThemeColors(colors);
      },
      error: (error) => {
        console.error('❌ Erreur lors du chargement des couleurs du thème:', error);
        // Applique les couleurs par défaut en cas d'erreur
        this.applyDefaultColors();
      }
    });
  }

  /**
   * Applique les couleurs au CSS
   */
  private applyThemeColors(colors: ThemeColors): void {
    const root = document.documentElement;

    root.style.setProperty('--bs-primary', colors.primary_color);
    root.style.setProperty('--bs-secondary', colors.secondary_color);
    root.style.setProperty('--bs-success', colors.success_color);
    root.style.setProperty('--bs-danger', colors.danger_color);
    root.style.setProperty('--bs-warning', colors.warning_color);
    root.style.setProperty('--bs-info', colors.info_color);
    root.style.setProperty('--bs-dark', colors.dark_color);
    root.style.setProperty('--bs-light', colors.light_color);

    // Applique aussi les variations (hover, focus, etc.)
    this.applyColorVariations(colors);
  }

  /**
   * Applique les variations de couleurs (hover, focus, etc.)
   */
  private applyColorVariations(colors: ThemeColors): void {
    const root = document.documentElement;

    // Génère des variations plus sombres pour les états hover
    root.style.setProperty('--bs-primary-hover', this.darkenColor(colors.primary_color, 10));
    root.style.setProperty('--bs-secondary-hover', this.darkenColor(colors.secondary_color, 10));
    root.style.setProperty('--bs-success-hover', this.darkenColor(colors.success_color, 10));
    root.style.setProperty('--bs-danger-hover', this.darkenColor(colors.danger_color, 10));
    root.style.setProperty('--bs-warning-hover', this.darkenColor(colors.warning_color, 10));
    root.style.setProperty('--bs-info-hover', this.darkenColor(colors.info_color, 10));
  }

  /**
   * Assombrit une couleur hexadécimale
   */
  private darkenColor(color: string, percent: number): string {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) - amt;
    const G = (num >> 8 & 0x00FF) - amt;
    const B = (num & 0x0000FF) - amt;
    return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
  }

  /**
   * Applique les couleurs par défaut
   */
  private applyDefaultColors(): void {
    const defaultColors: ThemeColors = {
      primary_color: '#4d8af0',
      secondary_color: '#6c757d',
      success_color: '#28a745',
      danger_color: '#dc3545',
      warning_color: '#ffc107',
      info_color: '#17a2b8',
      dark_color: '#343a40',
      light_color: '#f8f9fa'
    };

    this.applyThemeColors(defaultColors);
    this.colorsSubject.next(defaultColors);
  }

  /**
   * Met à jour une couleur spécifique
   */
  updateColor(colorKey: keyof ThemeColors, colorValue: string): void {
    const currentColors = this.colorsSubject.value;
    if (currentColors) {
      const updatedColors = { ...currentColors, [colorKey]: colorValue };
      this.colorsSubject.next(updatedColors);
      this.applyThemeColors(updatedColors);
    }
  }

  /**
   * Recharge les couleurs depuis l'API
   */
  refreshTheme(): void {
    this.loadThemeColors();
  }
}
