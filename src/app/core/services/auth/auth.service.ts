import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { LoginResponse } from "../interface/models";
import { environment } from '../../../../environments/environment';


@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private url: string = environment.backend;

  constructor(private http: HttpClient) {}

  login(credentials: { email: string; password: string }): Observable<{ success: boolean; data: LoginResponse }> {
    return this.http.post<{ success: boolean; data: LoginResponse }>(`${this.url}/login`, credentials);
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }
}
