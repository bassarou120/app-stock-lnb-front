// src/app/core/services/auth-permissions/auth-permission.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { Permission, PaginatedResponse, Module, Fonctionnalite } from '../interface/models'; // Assure-toi que ces imports sont corrects

@Injectable({
  providedIn: 'root',
})
export class AuthPermissionService {
  private apiUrl = `${environment.backend}/parametrage/permissions`; // Endpoint pour les permissions
  private authUserRoleId: number | null = null; // ID du rôle de l'utilisateur connecté
  
  // Utilisation d'un BehaviorSubject pour que les composants puissent s'abonner aux changements de permissions
  private userPermissionsSubject = new BehaviorSubject<Permission[]>([]);
  public userPermissions$: Observable<Permission[]> = this.userPermissionsSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Définit le rôle de l'utilisateur connecté et charge ses permissions.
   * Cette méthode sera appelée après la connexion de l'utilisateur.
   * @param roleId L'ID du rôle de l'utilisateur connecté.
   */
  loadUserPermissions(roleId: number): Observable<Permission[]> {
    this.authUserRoleId = roleId;
    
    // Si tu as un endpoint spécifique pour récupérer les permissions par rôle, utilise-le ici:
    // ex: this.http.get<any>(`${this.apiUrl}/by-role/${roleId}`).pipe(...)
    
    // Pour l'instant, on récupère toutes les permissions et on filtre côté client
    // (comme dans PermissionService, mais l'idéal est un endpoint dédié au backend)
    return this.http.get<any>(this.apiUrl).pipe(
      map((response: any) => response.data.data as Permission[]), // Assure-toi que c'est le bon chemin pour tes données paginées
      tap((allPermissions: Permission[]) => {
        const filteredPermissions = allPermissions.filter(p => p.role_id === roleId && p.is_active);
        this.userPermissionsSubject.next(filteredPermissions); // Met à jour le BehaviorSubject
        console.log(`AuthPermissionService: Permissions chargées pour le rôle ${roleId}:`, filteredPermissions);
      }),
      catchError(error => {
        console.error('AuthPermissionService: Erreur lors du chargement des permissions utilisateur:', error);
        this.userPermissionsSubject.next([]); // En cas d'erreur, vider les permissions
        return of([]); // Retourne un Observable vide pour que le flux ne se brise pas
      })
    );
  }

  /**
   * Vérifie si l'utilisateur connecté a une permission spécifique.
   * @param moduleLibelle Le libellé du module (ex: 'Gestion du personnel').
   * @param fonctionnaliteLibelle Le libellé de la fonctionnalité (ex: 'Ajout du personnel').
   * @returns `true` si la permission est active pour l'utilisateur, `false` sinon.
   */
  hasPermission(moduleLibelle: string, fonctionnaliteLibelle: string): boolean {
    const permissions = this.userPermissionsSubject.getValue();
    
    // Trouve la permission correspondante
    const found = permissions.find(p => 
      p.module?.libelle_module === moduleLibelle && 
      p.fonctionnalite?.libelle_fonctionnalite === fonctionnaliteLibelle
    );
    
    // La permission est accordée si elle est trouvée et is_active est true
    return !!found && found.is_active;
  }

  /**
   * Réinitialise les permissions de l'utilisateur (par exemple, lors de la déconnexion).
   */
  clearPermissions(): void {
    this.authUserRoleId = null;
    this.userPermissionsSubject.next([]);
    console.log('AuthPermissionService: Permissions utilisateur effacées.');
  }

  // --- Méthode pour obtenir le rôle de l'utilisateur (si besoin) ---
  getAuthUserRoleId(): number | null {
    return this.authUserRoleId;
  }
}