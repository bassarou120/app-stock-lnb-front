// src/app/core/services/utilisateurs/utilisateurs.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators'; // Importez l'opérateur map
import { User, Role, Employe, Utilisateur } from '../interface/models';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UtilisateurService {

  private apiUrl: string = environment.backend;
  private url: string = environment.backend;

  constructor(private http: HttpClient) { }

  getAllUsers(): Observable<User[]> { // Le type de retour est maintenant User[]
    return this.http.get<any>(`${this.apiUrl}/users`).pipe(
      map(response => response.data as User[]) // Transforme la réponse paginée en un tableau d'utilisateurs
    );
  }
  // Nouvelle méthode pour récupérer un utilisateur par son ID
  getUserById(id: string): Observable<Utilisateur> {
    return this.http.get<Utilisateur>(`${this.apiUrl}/users/${id}`);
  }

  getAllRoles(): Observable<Role[]> { // Le type de retour est maintenant Role[]
    // Si tes rôles sont aussi paginés et que tu veux la même logique que pour les utilisateurs,
    // tu peux faire la même transformation ici. Si non, laisse-le tel quel.
    return this.http.get<any>(`${this.apiUrl}/roles`).pipe(
      map(response => response.data as Role[]) // Supposons que les rôles soient aussi paginés
    );
  }

  getAllEmployes(): Observable<Employe[]> {
    return this.http.get<{ success: boolean; message: string; data: { data: Employe[] } }>(
      `${this.url}/employes`
    ).pipe(
      map((response: { success: boolean; message: string; data: { data: Employe[] } }) =>
        response.data.data // On récupère uniquement le tableau de Employe
      )
    );
  }

  saveUser(user: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/users`, user);
  }

  editUser(user: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/users/${user.id}`, user);
  }
  deleteUser(id: string): Observable<any> { // <-- CORRIGÉ : L'ID DOIT ÊTRE UN STRING
    console.log(`Sending DELETE request to: ${this.apiUrl}/users/${id}`); // Pour le débogage
    return this.http.delete<any>(`${this.apiUrl}/users/${id}`);
  }

  updateUser(id: string, userData: { role_id: number; active: boolean }): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/users/${id}`, userData);
  }

  toggleUserActiveStatus(id: string): Observable<any> { // 👈 CHANGEMENT: 'id' est maintenant de type 'string'
    // Note : Nous utilisons une requête PATCH sans corps ({}) car le contrôleur
    // Laravel utilise l'ID dans l'URL pour déterminer le nouvel état.
    console.log(`Sending PATCH request to: ${this.apiUrl}/users/${id}/toggle-active`); 
    
    // Assurez-vous que l'URL correspond à votre route Laravel (ex: /users/{user}/toggle-active)
    return this.http.patch<any>(`${this.apiUrl}/users/${id}/toggle-active`, {});
  }
  // deleteUser(id: number): Observable<any> {
  //   return this.http.delete<any>(`${this.apiUrl}/users/${id}`);
  // }
}