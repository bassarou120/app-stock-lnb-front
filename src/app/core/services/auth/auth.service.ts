import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { LoginResponse, Permission } from "../interface/models";
import { environment } from '../../../../environments/environment';


@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private url: string = environment.backend;

  constructor(private http: HttpClient) {}

  login(credentials: any): Observable<any> {
    return this.http.post(`${this.url}/login`, credentials).pipe(
      tap((response: any) => {
        // Sauvegarder l'utilisateur et le token
        localStorage.setItem('user', JSON.stringify(response.user));
        localStorage.setItem('token', response.token);
        localStorage.setItem('isLoggedin', 'true'); // 🔥 AJOUTEZ CETTE LIGNE

        console.log('✅ Connexion réussie, utilisateur sauvegardé');

        // 🔥 CORRECTION : Charger les permissions de manière asynchrone
        setTimeout(() => {
          this.loadUserPermissions();
        }, 100);
      })
    );
  }

  // 🔥 NOUVELLE MÉTHODE : Charger les permissions utilisateur
private loadUserPermissions(): void {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user.role_id) {
      console.log('⚠️ Pas de role_id trouvé pour l\'utilisateur');
      return;
    }

    console.log('🔄 Chargement des permissions pour role_id:', user.role_id);

    this.http.get<any[]>(`${this.url}/permissions/role/${user.role_id}`).subscribe({
      next: (permissions: any[]) => {
        console.log('📋 Permissions reçues:', permissions);

        const activePermissions = permissions.filter(p => p.is_active === true);

        const allowedModules: string[] = [];
        activePermissions.forEach(permission => {
          if (permission.module && permission.module.libelle_module) {
            const moduleName = permission.module.libelle_module;
            if (!allowedModules.includes(moduleName)) {
              allowedModules.push(moduleName);
            }
          }
        });

        console.log('🚀 CONNEXION - Permissions actives:', activePermissions);
        console.log('🚀 CONNEXION - Modules autorisés:', allowedModules);

        localStorage.setItem('permissions', JSON.stringify(activePermissions));
        localStorage.setItem('allowedModules', JSON.stringify(allowedModules));

        window.dispatchEvent(new CustomEvent('permissionsLoaded', {
          detail: { permissions: activePermissions, allowedModules: allowedModules }
        }));
      },
      error: (error) => {
        console.error('❌ Erreur chargement permissions:', error);
        // Ne pas bloquer la connexion si les permissions échouent
      }
    });
  }




  sendOTP(email: string): Observable<any> {
    return this.http.post(`${this.url}/forgot-password`, { email });
  }

  verifyOTP(email: string, otp_code: string): Observable<any> {
    return this.http.post(`${this.url}/verify-otp`, { email, otp_code });
  }

  resetPassword(data: {
    email: string;
    otp_code: string;
    password: string;
    password_confirmation: string;
  }): Observable<any> {
    return this.http.post(`${this.url}/reset-password`, data);
  }



   logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('isLoggedin');
    localStorage.removeItem('permissions');
    localStorage.removeItem('allowedModules');
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }
}
