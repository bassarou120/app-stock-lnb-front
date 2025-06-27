import { Injectable } from '@angular/core';
import { Observable} from 'rxjs';

import { HttpClient } from '@angular/common/http';
import {environment} from "../../../../environments/environment";
import { Permission } from "../interface/models";
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class PermissionService  {
  private url: string = environment.backend;

  constructor(private http: HttpClient) {}

  getPermissions(): Observable<Permission[]> {
    return this.http.get<any>(`${this.url}/permissions`).pipe(
      map(response => response.data.data)
    );
  }

   getCurrentUserPermissions(): Observable<Permission[]> {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const roleId = user.role_id;

  return this.http.get<Permission[]>(`${this.url}/permissions/role/${roleId}`);
} 

/* getCurrentUserPermissions(): Observable<Permission[]> {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const roleId = user.role_id;
  return this.http.get<any>(`${this.url}/permissions/role/${roleId}`).pipe(
    map(response => {
      console.log('🔍 Structure de la réponse getCurrentUserPermissions:', response);
      // Essayez différentes structures possibles :
      if (response.data && response.data.data) {
        return response.data.data; // Structure comme getPermissions()
      } else if (response.data) {
        return response.data; // Structure directe dans data
      } else if (Array.isArray(response)) {
        return response; // Réponse directe en tableau
      } else {
        console.error('Structure de réponse inconnue:', response);
        return [];
      }
    })
  );
} */




  updatePermission(payload: any): Observable<any> {
  return this.http.post(`${this.url}/permissions/toggle`, payload);
}

}
