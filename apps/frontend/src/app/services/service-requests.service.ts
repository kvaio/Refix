import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export type ServiceRequestStatus =
  | 'SOLICITADO'
  | 'CANCELADO'
  | 'AGENDADO'
  | 'RECIBIDO'
  | 'EN_PROCESO'
  | 'ESPERANDO_PIEZA'
  | 'LISTO_PARA_ENTREGA'
  | 'ENTREGADO'
  | 'EN_GARANTIA'
  | 'RESUELTO'
  | 'CERRADO';

export interface ServiceRequest {
  id: string;
  title: string;
  description: string;
  deviceType: string;
  serviceAddress: string | null;
  latitude: number | null;
  longitude: number | null;
  status: ServiceRequestStatus;
  technicianId: string | null;
  technician: { id: string; name: string; technicianProfile: { profession: string | null } | null } | null;
  review: { id: string; rating: number; comment: string | null; createdAt: string } | null;
  scheduledAt: string | null;
  createdAt: string;
  client: {
    name: string;
    phone: string | null;
    street: string | null;
    exteriorNumber: string | null;
    interiorNumber: string | null;
    neighborhood: string | null;
    municipality: string | null;
    state: string | null;
  } | null;
}

export interface ServiceMessage {
  id: string;
  body: string;
  createdAt: string;
  sender: { id: string; name: string; role: 'CLIENT' | 'TECHNICIAN' | 'ADMIN' };
}

export interface ServiceRequestHistoryEntry {
  id: string;
  previousStatus: ServiceRequestStatus | null;
  newStatus: ServiceRequestStatus;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class ServiceRequestsService {
  private readonly apiUrl = environment.apiUrl + '/service-requests';

  constructor(private readonly http: HttpClient) {}

  findAll(): Observable<ServiceRequest[]> {
    return this.http.get<ServiceRequest[]>(this.apiUrl);
  }

  create(data: {
    title: string;
    description: string;
    deviceType: string;
    serviceAddress?: string;
    technicianId?: string;
  }): Observable<ServiceRequest> {
    return this.http.post<ServiceRequest>(this.apiUrl, data);
  }

  cancel(requestId: string): Observable<ServiceRequest> {
    return this.http.patch<ServiceRequest>(this.apiUrl + '/' + encodeURIComponent(requestId) + '/cancel', {});
  }

  getHistory(requestId: string): Observable<ServiceRequestHistoryEntry[]> {
    return this.http.get<ServiceRequestHistoryEntry[]>(this.apiUrl + '/' + encodeURIComponent(requestId) + '/history');
  }

  getMessages(requestId: string): Observable<ServiceMessage[]> {
    return this.http.get<ServiceMessage[]>(this.apiUrl + '/' + encodeURIComponent(requestId) + '/messages');
  }

  sendMessage(requestId: string, body: string): Observable<ServiceMessage> {
    return this.http.post<ServiceMessage>(this.apiUrl + '/' + encodeURIComponent(requestId) + '/messages', { body });
  }

  leaveReview(requestId: string, rating: number, comment: string): Observable<unknown> {
    return this.http.post(this.apiUrl + '/' + encodeURIComponent(requestId) + '/review', { rating, comment });
  }

  accept(requestId: string): Observable<ServiceRequest> {
    return this.http.patch<ServiceRequest>(
      this.apiUrl + '/' + encodeURIComponent(requestId) + '/accept',
      {},
    );
  }

  updateStatus(requestId: string, status: ServiceRequestStatus): Observable<ServiceRequest> {
    return this.http.patch<ServiceRequest>(
      this.apiUrl + '/' + encodeURIComponent(requestId) + '/status',
      { status },
    );
  }
}
