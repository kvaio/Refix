import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: 'CLIENT' | 'TECHNICIAN' | 'ADMIN';
}

export interface AuthResponse {
  access_token: string;
  user: AuthUser;
}

export interface RegisterTechnicianProfile {
  profession: string;
  yearsExperience: number;
  certifications?: string;
  bio: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly apiUrl = `${environment.apiUrl}/auth`;

  constructor(private readonly http: HttpClient) {}

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/login`, { email, password })
      .pipe(tap((response) => this.saveSession(response)));
  }

  register(data: {
    firstNames: string;
    paternalSurname: string;
    maternalSurname: string;
    birthDate: string;
    sex: string;
    email: string;
    password: string;
    phone?: string;
    role?: 'CLIENT' | 'TECHNICIAN';
    street: string;
    exteriorNumber: string;
    interiorNumber?: string;
    neighborhood: string;
    municipality: string;
    state: string;
    postalCode?: string;
    technicianProfile?: RegisterTechnicianProfile;
  }): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/register`, data)
      .pipe(tap((response) => this.saveSession(response)));
  }

  getToken(): string | null {
    return sessionStorage.getItem('refix_access_token');
  }

  getUser(): AuthUser | null {
    const value = sessionStorage.getItem('refix_user');
    if (!value) return null;

    try {
      return JSON.parse(value) as AuthUser;
    } catch {
      return null;
    }
  }

  logout(): void {
    sessionStorage.removeItem('refix_access_token');
    sessionStorage.removeItem('refix_user');
  }

  private saveSession(response: AuthResponse): void {
    sessionStorage.setItem('refix_access_token', response.access_token);
    sessionStorage.setItem('refix_user', JSON.stringify(response.user));
  }
}
