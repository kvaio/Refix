import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { timeout } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export type ManagedRole = 'CLIENT' | 'TECHNICIAN' | 'ADMIN';
export type ManagedStatus = 'active' | 'suspended';

export interface AdminAccount {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: ManagedRole;
  isActive: boolean;
  canDelete: boolean;
  _count: { serviceRequests: number; assignedServices: number; statusHistoryEntries: number; tradeInEstimates: number; chatbotLogs: number };
  createdAt: string;
  firstNames: string | null;
  paternalSurname: string | null;
  maternalSurname: string | null;
  birthDate: string | null;
  sex: string | null;
  street: string | null;
  exteriorNumber: string | null;
  interiorNumber: string | null;
  neighborhood: string | null;
  municipality: string | null;
  state: string | null;
  postalCode: string | null;
  technicianProfile: {
    profession: string | null;
    yearsExperience: number | null;
    certifications: string | null;
    bio: string | null;
    rating: number;
    isAvailable: boolean;
    latitude: number | null;
    longitude: number | null;
  } | null;
}

export interface AdminDashboard {
  metrics: {
    total: number;
    clients: number;
    technicians: number;
    admins: number;
    active: number;
    suspended: number;
  };
  accounts: AdminAccount[];
}

export interface AdminAccountPayload {
  firstNames: string;
  paternalSurname: string;
  maternalSurname: string;
  birthDate: string;
  sex: string;
  email: string;
  phone?: string | null;
  password?: string;
  role?: 'CLIENT' | 'TECHNICIAN';
  street: string;
  exteriorNumber: string;
  interiorNumber?: string | null;
  neighborhood: string;
  municipality: string;
  state: string;
  postalCode?: string | null;
  technicianProfile?: {
    profession: string;
    yearsExperience: number;
    certifications?: string | null;
    bio: string;
  };
}

@Injectable({ providedIn: 'root' })
export class AdminAccountsService {
  private readonly apiUrl = environment.apiUrl + '/users/admin/accounts';

  constructor(private readonly http: HttpClient) {}

  getDashboard(filters: {
    search?: string;
    role?: ManagedRole;
    status?: ManagedStatus;
  }): Observable<AdminDashboard> {
    let params = new HttpParams();
    if (filters.search) params = params.set('search', filters.search);
    if (filters.role) params = params.set('role', filters.role);
    if (filters.status) params = params.set('status', filters.status);
    return this.http.get<AdminDashboard>(this.apiUrl, { params }).pipe(timeout(20000));
  }

  createAccount(data: AdminAccountPayload): Observable<unknown> {
    return this.http.post(this.apiUrl, data).pipe(timeout(20000));
  }

  updateAccount(accountId: string, data: Partial<AdminAccountPayload>): Observable<unknown> {
    return this.http.patch(this.apiUrl + '/' + encodeURIComponent(accountId), data).pipe(timeout(20000));
  }

  deleteAccount(accountId: string): Observable<{ id: string; deleted: boolean }> {
    return this.http.delete<{ id: string; deleted: boolean }>(
      this.apiUrl + '/' + encodeURIComponent(accountId),
    ).pipe(timeout(20000));
  }

  clearServiceRequests(accountId: string): Observable<{ id: string; deletedRequests: number }> {
    return this.http.delete<{ id: string; deletedRequests: number }>(
      this.apiUrl + '/' + encodeURIComponent(accountId) + '/service-requests',
    ).pipe(timeout(20000));
  }

  setActive(accountId: string, isActive: boolean): Observable<Pick<AdminAccount, 'id' | 'name' | 'email' | 'role' | 'isActive'>> {
    return this.http.patch<Pick<AdminAccount, 'id' | 'name' | 'email' | 'role' | 'isActive'>>(
      this.apiUrl + '/' + encodeURIComponent(accountId) + '/status',
      { isActive },
    ).pipe(timeout(20000));
  }
}
