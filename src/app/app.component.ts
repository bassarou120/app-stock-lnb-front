import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeModeService } from './core/services/theme-mode.service';
import { IdleService } from './core/services/idle/idle.service';
import {environment} from "../environments/environment";
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'demo1';

  constructor(private themeModeService: ThemeModeService, private idleService: IdleService, private http: HttpClient) {}
  ngOnInit(): void {
    const isLoggedIn = localStorage.getItem('isLoggedin') === 'true';
    if (isLoggedIn) {
      this.idleService.startWatching();

      // 🔥 SIMPLIFICATION : Vérifier si les permissions sont déjà chargées
      const allowedModules = localStorage.getItem('allowedModules');
      if (!allowedModules) {
        console.log('🔄 Rechargement permissions au démarrage app');
        this.loadUserPermissions();
      } else {
        console.log('✅ Permissions déjà présentes au démarrage');
      }
    }
  }

private loadUserPermissions(): void {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user.role_id) return;

    this.http.get<any[]>(`${environment.backend}/permissions/role/${user.role_id}`).subscribe({
      next: (permissions: any[]) => {
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

        localStorage.setItem('permissions', JSON.stringify(activePermissions));
        localStorage.setItem('allowedModules', JSON.stringify(allowedModules));

        window.dispatchEvent(new CustomEvent('permissionsLoaded', {
          detail: { permissions: activePermissions, allowedModules: allowedModules }
        }));
      },
      error: (error) => {
        console.error('❌ Erreur rechargement permissions:', error);
      }
    });
  }
}

