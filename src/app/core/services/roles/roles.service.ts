// src/app/core/services/roles/role.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators'; // Importez l'opérateur map
import { Role } from '../interface/models'; // Assurez-vous que l'interface Role est définie
import { environment } from '../../../../environments/environment'; // Importez l'environnement pour l'URL de base

@Injectable({
  providedIn: 'root'
})
export class RoleService {
  // Utilisez l'URL de base de l'environnement comme dans votre exemple
  private url: string = environment.backend;

  constructor(private http: HttpClient) { }

  getAllRoles(): Observable<Role[]> {
    return this.http.get<{ success: boolean; message: string; data: { data: Role[] } }>(
      `${this.url}/roles` // Endpoint pour les rôles
    ).pipe(
      map((response: { success: boolean; message: string; data: { data: Role[] } }) =>
        response.data.data // On récupère uniquement le tableau de Role
      )
    );
  }

  saveRole(roleData: { libelle_role: string }): Observable<Role> {
    return this.http.post<{ success: boolean; message: string; data: Role }>(
      `${this.url}/roles`, roleData
    ).pipe(
      map(response => response.data) // Extrait directement l'objet Role du champ 'data'
    );
  }

  updateRole(roleId: string, roleData: { libelle_role: string }): Observable<Role> {
    return this.http.put<{ success: boolean; message: string; data: Role }>(
      `${this.url}/roles/${roleId}`, roleData
    ).pipe(
      map(response => response.data) // Extrait directement l'objet Role du champ 'data'
    );
  }

  deleteRole(roleId: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/roles/${roleId}`);
  }
}