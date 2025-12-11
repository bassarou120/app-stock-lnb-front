import { Injectable } from '@angular/core';
import { Observable} from 'rxjs';

import { HttpClient } from '@angular/common/http';
import {environment} from "../../../../environments/environment";
import { Permission } from "../interface/models";
import { catchError, map, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class PermissionService  {
  private url: string = environment.backend;

  constructor(private http: HttpClient) {}

  getPermissions(): Observable<Permission[]> {
    return this.http.get<any>(`${this.url}/permissions`).pipe(
      tap(response => {
        console.log('🔍 SERVICE - Réponse API complète:', response);
        console.log('🔍 SERVICE - Type de response:', typeof response);
        console.log('🔍 SERVICE - response.data existe?', !!response?.data);
      }),
      map(response => {
        // 🔥 Extraire les données du wrapper Laravel
        if (response && response.data) {
          console.log('✅ SERVICE - Extraction de response.data, longueur:', response.data.length);
          return response.data;
        }
        console.warn('⚠️ SERVICE - Structure inattendue, retour response directement');
        return response;
      })
    );
  }

  getCurrentUserPermissions(): Observable<Permission[]> {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const roleId = user.role_id;

    return this.http.get<Permission[]>(`${this.url}/permissions/role/${roleId}`);
  } 

  updatePermission(payload: any): Observable<any> {
    return this.http.post(`${this.url}/permissions/toggle`, payload);
  }

}
