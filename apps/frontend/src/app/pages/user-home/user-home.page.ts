import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription, TimeoutError, interval } from 'rxjs';
import { timeout } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import {
  TechnicianProfile,
  TechniciansService,
} from '../../services/technicians.service';
import {
  ServiceMessage,
  ServiceRequest,
  ServiceRequestHistoryEntry,
  ServiceRequestsService,
  ServiceRequestStatus,
} from '../../services/service-requests.service';

interface MapTile {
  url: string;
  left: number;
  top: number;
  renderId: number;
}

@Component({
  selector: 'app-user-home',
  templateUrl: './user-home.page.html',
  styleUrls: ['./user-home.page.scss'],
  standalone: false,
})
export class UserHomePage implements OnInit, OnDestroy {
  private readonly tileSize = 256;
  private readonly mapZoom = 15;
  private mapRenderId = 0;
  private mapTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private locationTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private locationRequestId = 0;
  private loadedTileCount = 0;
  private failedTileCount = 0;

  mapTiles: MapTile[] = [];
  mapShiftX = 0;
  mapShiftY = 0;
  hasUserLocation = false;
  mapLoading = false;
  mapMessage = '';
  mapStatus = 'Preparando el mapa…';
  mapExternalUrl: string | null = null;
  isLocating = false;

  technicians: TechnicianProfile[] = [];
  selectedTechnician: TechnicianProfile | null = null;
  loadingTechnicians = false;
  technicianError = '';
  technicianQuery = '';
  showAvailableOnly = false;
  sortByRating = false;
  clientRequests: ServiceRequest[] = [];
  requestsLoading = false;
  requestsError = '';
  isRequestFormOpen = false;
  isCreatingRequest = false;
  requestError = '';
  requestSuccess = '';
  selectedRequestTechnicianId: string | null = null;
  selectedRequestTechnicianName = '';
  requestDraft = { title: '', deviceType: '', description: '', serviceAddress: '' };
  busyRequestId: string | null = null;
  historyLoadingId: string | null = null;
  requestHistory: Record<string, ServiceRequestHistoryEntry[]> = {};
  reviewRequest: ServiceRequest | null = null;
  reviewRating = 5;
  reviewComment = '';
  isSavingReview = false;
  reviewError = '';
  chatRequest: ServiceRequest | null = null;
  chatMessages: ServiceMessage[] = [];
  messageDraft = '';
  chatLoading = false;
  chatError = '';
  isSendingMessage = false;
  private chatPolling: Subscription | null = null;

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly techniciansService: TechniciansService,
    private readonly serviceRequestsService: ServiceRequestsService,
  ) {}

  ngOnInit(): void {
    // Muestra el mapa de referencia de inmediato; luego lo centra en la ubicación real.
    this.mapExternalUrl =
      'https://www.openstreetmap.org/?mlat=19.4326&mlon=-99.1332#map=15/19.4326/-99.1332';
    this.createMapTiles(19.4326, -99.1332, false);
    this.mapStatus = 'Mapa de referencia · buscando tu ubicación…';
    this.loadTechnicians();
    this.loadClientRequests();
    this.locateOnMap();
  }

  ngOnDestroy(): void {
    this.chatPolling?.unsubscribe();
    if (this.mapTimeoutId) clearTimeout(this.mapTimeoutId);
    if (this.locationTimeoutId) clearTimeout(this.locationTimeoutId);
  }

  loadTechnicians(): void {
    this.loadingTechnicians = true;
    this.technicianError = '';

    this.techniciansService.findAll().subscribe({
      next: (technicians) => {
        this.technicians = technicians;
        this.loadingTechnicians = false;
      },
      error: (error: unknown) => {
        this.technicianError =
          error instanceof HttpErrorResponse && error.status === 0
            ? 'No hay conexión con el servidor.'
            : 'No pudimos cargar los perfiles de técnicos.';
        this.loadingTechnicians = false;
      },
    });
  }

  get filteredTechnicians(): TechnicianProfile[] {
    const query = this.technicianQuery.trim().toLocaleLowerCase();
    return this.technicians
      .filter((technician) => !this.showAvailableOnly || technician.available)
      .filter(
        (technician) =>
          !query ||
          technician.name.toLocaleLowerCase().includes(query) ||
          (technician.profession ?? '').toLocaleLowerCase().includes(query) ||
          (technician.bio ?? '').toLocaleLowerCase().includes(query) ||
          (technician.certifications ?? '').toLocaleLowerCase().includes(query),
      )
      .sort((a, b) =>
        this.sortByRating
          ? b.rating - a.rating
          : Number(b.available) - Number(a.available) || b.rating - a.rating,
      );
  }

  openTechnicianProfile(technician: TechnicianProfile): void {
    this.selectedTechnician = technician;
  }

  closeTechnicianProfile(): void {
    this.selectedTechnician = null;
  }

  getInitials(name: string): string {
    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0] ?? '')
      .join('')
      .toLocaleUpperCase();
  }

  loadClientRequests(): void {
    this.requestsLoading = true;
    this.requestsError = '';
    this.serviceRequestsService.findAll().pipe(timeout(20000)).subscribe({
      next: (requests) => {
        this.clientRequests = requests;
        this.requestsLoading = false;
      },
      error: (error: unknown) => {
        this.requestsLoading = false;
        this.requestsError = this.requestErrorFor(error, 'No se pudieron cargar tus solicitudes.');
      },
    });
  }

  openRequestForm(technician: TechnicianProfile | null = null): void {
    this.selectedRequestTechnicianId = technician?.available ? technician.id : null;
    this.selectedRequestTechnicianName = technician?.available ? technician.name : '';
    this.requestDraft = { title: '', deviceType: '', description: '', serviceAddress: '' };
    this.requestError = '';
    this.isRequestFormOpen = true;
    this.selectedTechnician = null;
  }

  closeRequestForm(): void {
    this.isRequestFormOpen = false;
    this.requestError = '';
  }

  createClientRequest(): void {
    if (this.isCreatingRequest) return;
    this.requestError = '';
    this.isCreatingRequest = true;
    this.serviceRequestsService.create({
      title: this.requestDraft.title.trim(),
      deviceType: this.requestDraft.deviceType.trim(),
      description: this.requestDraft.description.trim(),
      ...(this.requestDraft.serviceAddress.trim() ? { serviceAddress: this.requestDraft.serviceAddress.trim() } : {}),
      ...(this.selectedRequestTechnicianId ? { technicianId: this.selectedRequestTechnicianId } : {}),
    }).pipe(timeout(20000)).subscribe({
      next: () => {
        this.isCreatingRequest = false;
        this.closeRequestForm();
        this.requestSuccess = 'Tu solicitud quedó registrada. Puedes seguir el avance desde aquí.';
        this.loadClientRequests();
      },
      error: (error: unknown) => {
        this.isCreatingRequest = false;
        this.requestError = this.requestErrorFor(error, 'No se pudo crear la solicitud. Revisa los datos e inténtalo de nuevo.');
      },
    });
  }

  cancelClientRequest(request: ServiceRequest): void {
    if (this.busyRequestId) return;
    this.busyRequestId = request.id;
    this.requestSuccess = '';
    this.serviceRequestsService.cancel(request.id).pipe(timeout(15000)).subscribe({
      next: () => {
        this.busyRequestId = null;
        this.requestSuccess = 'La solicitud se canceló.';
        this.loadClientRequests();
      },
      error: (error: unknown) => {
        this.busyRequestId = null;
        this.requestsError = this.requestErrorFor(error, 'No se pudo cancelar la solicitud.');
      },
    });
  }

  toggleRequestHistory(request: ServiceRequest): void {
    if (this.requestHistory[request.id]) {
      const { [request.id]: _closed, ...remaining } = this.requestHistory;
      this.requestHistory = remaining;
      return;
    }
    this.historyLoadingId = request.id;
    this.serviceRequestsService.getHistory(request.id).pipe(timeout(15000)).subscribe({
      next: (history) => {
        this.requestHistory = { ...this.requestHistory, [request.id]: history };
        this.historyLoadingId = null;
      },
      error: (error: unknown) => {
        this.historyLoadingId = null;
        this.requestsError = this.requestErrorFor(error, 'No se pudo cargar el historial.');
      },
    });
  }

  requestStatusLabel(status: ServiceRequestStatus): string {
    const labels: Record<ServiceRequestStatus, string> = {
      SOLICITADO: 'Buscando técnico', CANCELADO: 'Cancelado', AGENDADO: 'Aceptado por el técnico',
      RECIBIDO: 'Equipo recibido', EN_PROCESO: 'En reparación', ESPERANDO_PIEZA: 'Esperando una pieza',
      LISTO_PARA_ENTREGA: 'Listo para entrega', ENTREGADO: 'Entregado', EN_GARANTIA: 'En garantía',
      RESUELTO: 'Resuelto', CERRADO: 'Cerrado',
    };
    return labels[status];
  }

  canReviewRequest(request: ServiceRequest): boolean {
    return !request.review && !!request.technicianId && ['ENTREGADO', 'EN_GARANTIA', 'RESUELTO', 'CERRADO'].includes(request.status);
  }

  openReview(request: ServiceRequest): void {
    this.reviewRequest = request;
    this.reviewRating = 5;
    this.reviewComment = '';
    this.reviewError = '';
  }

  closeReview(): void {
    this.reviewRequest = null;
    this.reviewError = '';
  }

  saveReview(): void {
    if (!this.reviewRequest || this.isSavingReview) return;
    this.isSavingReview = true;
    this.reviewError = '';
    this.serviceRequestsService.leaveReview(this.reviewRequest.id, Number(this.reviewRating), this.reviewComment.trim()).pipe(timeout(15000)).subscribe({
      next: () => {
        this.isSavingReview = false;
        this.closeReview();
        this.requestSuccess = 'Gracias. Tu reseña se agregó al perfil del técnico.';
        this.loadClientRequests();
        this.loadTechnicians();
      },
      error: (error: unknown) => {
        this.isSavingReview = false;
        this.reviewError = this.requestErrorFor(error, 'No se pudo guardar la reseña.');
      },
    });
  }

  openConversation(request: ServiceRequest): void {
    if (!request.technicianId) return;
    this.chatPolling?.unsubscribe();
    this.chatRequest = request;
    this.chatMessages = [];
    this.chatError = '';
    this.chatLoading = true;
    this.refreshConversation();
    this.chatPolling = interval(5000).subscribe(() => this.refreshConversation(false));
  }

  closeConversation(): void {
    this.chatPolling?.unsubscribe();
    this.chatPolling = null;
    this.chatRequest = null;
    this.messageDraft = '';
  }

  refreshConversation(showLoading = true): void {
    if (!this.chatRequest) return;
    if (showLoading) this.chatLoading = true;
    this.serviceRequestsService.getMessages(this.chatRequest.id).pipe(timeout(15000)).subscribe({
      next: (messages) => {
        this.chatMessages = messages;
        this.chatLoading = false;
        this.chatError = '';
      },
      error: (error: unknown) => {
        this.chatLoading = false;
        this.chatError = this.requestErrorFor(error, 'No se pudo cargar la conversación.');
      },
    });
  }

  sendMessage(): void {
    if (!this.chatRequest || !this.messageDraft.trim() || this.isSendingMessage) return;
    this.isSendingMessage = true;
    this.serviceRequestsService.sendMessage(this.chatRequest.id, this.messageDraft.trim()).pipe(timeout(15000)).subscribe({
      next: () => {
        this.messageDraft = '';
        this.isSendingMessage = false;
        this.refreshConversation(false);
      },
      error: (error: unknown) => {
        this.isSendingMessage = false;
        this.chatError = this.requestErrorFor(error, 'No se pudo enviar el mensaje.');
      },
    });
  }

  isOwnMessage(message: ServiceMessage): boolean {
    return message.sender.id === this.authService.getUser()?.id;
  }

  private requestErrorFor(error: unknown, fallback: string): string {
    if (error instanceof TimeoutError) return 'El servidor tardó demasiado en responder. Inténtalo de nuevo.';
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) return 'No hay conexión con el backend.';
      if (Array.isArray(error.error?.message)) return error.error.message.join(' ');
      if (typeof error.error?.message === 'string') return error.error.message;
    }
    return fallback;
  }

  locateOnMap(): void {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      this.mapStatus = 'Ubicación no disponible · mapa de referencia';
      this.mapMessage = 'Este navegador no permite acceder a la ubicación.';
      return;
    }

    this.locationRequestId += 1;
    const requestId = this.locationRequestId;
    this.isLocating = true;
    this.mapStatus = 'Mapa de referencia · buscando tu ubicación…';
    this.mapMessage = '';
    if (this.locationTimeoutId) clearTimeout(this.locationTimeoutId);
    this.locationTimeoutId = setTimeout(() => {
      if (requestId !== this.locationRequestId) return;
      this.isLocating = false;
      this.mapStatus = 'No se obtuvo tu ubicación · mapa de referencia';
      this.mapMessage =
        'La ubicación tardó demasiado. El mapa sigue visible; vuelve a intentarlo.';
    }, 12000);

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        if (requestId !== this.locationRequestId) return;
        if (this.locationTimeoutId) clearTimeout(this.locationTimeoutId);
        this.locationTimeoutId = null;
        this.mapExternalUrl =
          'https://www.openstreetmap.org/?mlat=' +
          coords.latitude +
          '&mlon=' +
          coords.longitude +
          '#map=15/' +
          coords.latitude +
          '/' +
          coords.longitude;
        this.mapMessage = '';
        this.mapStatus = 'Centrando el mapa en tu ubicación…';
        this.createMapTiles(coords.latitude, coords.longitude, true);
      },
      (error: GeolocationPositionError) => {
        if (requestId !== this.locationRequestId) return;
        if (this.locationTimeoutId) clearTimeout(this.locationTimeoutId);
        this.locationTimeoutId = null;
        this.isLocating = false;
        this.mapStatus = 'Ubicación no disponible · mapa de referencia';
        this.mapMessage =
          error.code === error.PERMISSION_DENIED
            ? 'El navegador no compartió tu ubicación. Puedes reintentar desde el botón.'
            : 'No se pudo determinar tu ubicación. El mapa de referencia sigue visible.';
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    );
  }

  onTileSettled(renderId: number, failed: boolean): void {
    if (renderId !== this.mapRenderId) return;
    if (failed) {
      this.failedTileCount += 1;
    } else {
      this.loadedTileCount += 1;
    }

    if (this.loadedTileCount + this.failedTileCount < this.mapTiles.length) return;

    this.mapLoading = false;
    if (this.mapTimeoutId) {
      clearTimeout(this.mapTimeoutId);
      this.mapTimeoutId = null;
    }

    if (this.failedTileCount === this.mapTiles.length) {
      this.mapStatus = this.hasUserLocation
        ? 'No se pudo cargar el mapa'
        : 'Mapa no disponible';
      this.mapMessage =
        'No se pudieron descargar los mosaicos del mapa. Revisa tu conexión.';
      return;
    }

    if (this.failedTileCount > 0) {
      this.mapStatus = this.hasUserLocation
        ? 'Mapa cargado parcialmente'
        : 'Mapa de referencia cargado parcialmente';
      this.mapMessage = 'Algunas partes del mapa no cargaron.';
      return;
    }

    this.mapStatus = this.hasUserLocation
      ? 'Mapa centrado en tu ubicación'
      : 'Mapa de referencia · pulsa “Mi ubicación” para centrarlo';
    this.mapMessage = '';
    this.isLocating = false;
  }

  private createMapTiles(
    latitude: number,
    longitude: number,
    userLocation: boolean,
  ): void {
    const zoom = this.mapZoom;
    const tileCount = 2 ** zoom;
    const lat = Math.max(-85.05112878, Math.min(85.05112878, latitude));
    const lon = Math.max(-180, Math.min(180, longitude));
    const latitudeRadians = (lat * Math.PI) / 180;
    const tileX = ((lon + 180) / 360) * tileCount;
    const tileY =
      ((1 - Math.asinh(Math.tan(latitudeRadians)) / Math.PI) / 2) * tileCount;
    const centerTileX = Math.floor(tileX);
    const centerTileY = Math.floor(tileY);
    const renderId = ++this.mapRenderId;

    this.hasUserLocation = userLocation;
    this.mapShiftX =
      (2 + (tileX - centerTileX)) * this.tileSize;
    this.mapShiftY =
      (1 + (tileY - centerTileY)) * this.tileSize;
    this.loadedTileCount = 0;
    this.failedTileCount = 0;

    const tiles: MapTile[] = [];
    for (let row = -1; row <= 1; row += 1) {
      const y = centerTileY + row;
      if (y < 0 || y >= tileCount) continue;

      for (let column = -2; column <= 2; column += 1) {
        const rawX = centerTileX + column;
        const x = ((rawX % tileCount) + tileCount) % tileCount;
        tiles.push({
          url: 'https://tile.openstreetmap.org/' + zoom + '/' + x + '/' + y + '.png',
          left: (column + 2) * this.tileSize,
          top: (row + 1) * this.tileSize,
          renderId,
        });
      }
    }

    this.mapTiles = tiles;
    this.mapLoading = true;
    this.isLocating = userLocation ? false : this.isLocating;
    if (this.mapTimeoutId) clearTimeout(this.mapTimeoutId);
    this.mapTimeoutId = setTimeout(() => {
      if (renderId !== this.mapRenderId || !this.mapLoading) return;
      this.mapLoading = false;
      this.mapStatus = this.hasUserLocation
        ? 'La carga del mapa se demoró'
        : 'El mapa de referencia se demoró';
      this.mapMessage =
        'El servidor del mapa no respondió a tiempo. Revisa tu conexión o ábrelo en OpenStreetMap.';
      if (!this.mapExternalUrl) {
        this.mapExternalUrl =
          'https://www.openstreetmap.org/?mlat=19.4326&mlon=-99.1332#map=15/19.4326/-99.1332';
      }
      this.isLocating = false;
      this.mapTimeoutId = null;
    }, 10000);
  }

  get userName(): string {
    return this.authService.getUser()?.name?.trim() || 'Usuario';
  }

  logout(): void {
    this.authService.logout();
    void this.router.navigateByUrl('/login', { replaceUrl: true });
  }
}
