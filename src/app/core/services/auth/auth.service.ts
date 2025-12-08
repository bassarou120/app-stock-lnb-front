import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ExerciceResponse, LoginResponse, Permission } from "../interface/models";
import { environment } from '../../../../environments/environment';
import { Exercice } from "../interface/models";
import { switchMap } from 'rxjs/operators';
import { ProfileResponse, UpdateProfileData } from '../interface/models';


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
      console.log('📋 Permissions reçues (RAW):', permissions);

      const activePermissions = permissions.filter(p => p.is_active === true);
      console.log('📋 Permissions actives filtrées:', activePermissions);

      const allowedModules: string[] = [];
      const allowedFonctionnalites: string[] = [];

      activePermissions.forEach((permission, index) => {
        console.log(`🔍 Permission ${index}:`, permission);

        // Modules
        if (permission.module && permission.module.libelle_module) {
          const moduleName = permission.module.libelle_module;
          console.log(`   📁 Module trouvé: "${moduleName}"`);
          if (!allowedModules.includes(moduleName)) {
            allowedModules.push(moduleName);
          }
        } else {
          console.log('   ❌ Pas de module trouvé dans:', permission);
        }

        // 🔥 DEBUG : Fonctionnalités
        console.log('   🔍 Vérification fonctionnalité:', permission.fonctionnalite);
        if (permission.fonctionnalite) {
          console.log('   🔍 Libellé fonctionnalité:', permission.fonctionnalite.libelle_fonctionnalite);
          if (permission.fonctionnalite.libelle_fonctionnalite) {
            const fonctionnaliteName = permission.fonctionnalite.libelle_fonctionnalite;
            console.log(`   ⚡ Fonctionnalité trouvée: "${fonctionnaliteName}"`);
            if (!allowedFonctionnalites.includes(fonctionnaliteName)) {
              allowedFonctionnalites.push(fonctionnaliteName);
              console.log(`   ✅ Fonctionnalité ajoutée: "${fonctionnaliteName}"`);
            }
          } else {
            console.log('   ❌ libelle_fonctionnalite est vide');
          }
        } else {
          console.log('   ❌ Pas de fonctionnalite trouvée dans:', permission);
        }
      });

      console.log('🚀 FINAL - Modules autorisés:', allowedModules);
      console.log('🚀 FINAL - Fonctionnalités autorisées:', allowedFonctionnalites);

      localStorage.setItem('permissions', JSON.stringify(activePermissions));
      localStorage.setItem('allowedModules', JSON.stringify(allowedModules));
      localStorage.setItem('allowedFonctionnalites', JSON.stringify(allowedFonctionnalites));

      // 🔥 DEBUG : Vérifier ce qui est sauvegardé
      console.log('💾 Sauvegardé dans localStorage:');
      console.log('   allowedModules:', localStorage.getItem('allowedModules'));
      console.log('   allowedFonctionnalites:', localStorage.getItem('allowedFonctionnalites'));

      window.dispatchEvent(new CustomEvent('permissionsLoaded', {
        detail: {
          permissions: activePermissions,
          allowedModules: allowedModules,
          allowedFonctionnalites: allowedFonctionnalites
        }
      }));
    },
    error: (error) => {
      console.error('❌ Erreur chargement permissions:', error);
    }
  });
}

getExercice(): Observable<ExerciceResponse> {
  return this.http.get<ExerciceResponse>(`${this.url}/exercice/ouvert`);
}


  updateExercice(data: any): Observable<ExerciceResponse> {
    return this.http
      .put<Exercice>(`${this.url}/exercicestate/${data.id}/status`, data)
      .pipe(
        // Une fois le PUT fini, on relance le GET pour avoir l'exercice ouvert
        switchMap(() => this.getExercice())
      );
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

  getCurrentUser(): any {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  }

/*   updateProfile(data: any): Observable<any> {
    return this.http.put(`${this.url}/users/update`, data);
  } */

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  /**
   * Récupérer le profil de l'utilisateur connecté
   */
    getProfile(): Observable<any> {
      const token = localStorage.getItem('token');
      return this.http.get(`${this.url}/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
    }

  /**
   * Mettre à jour le profil de l'utilisateur
   */

updateProfile(data: any): Observable<any> {
  const token = localStorage.getItem('token');
  return this.http.put(`${this.url}/profile`, data, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
}



}
