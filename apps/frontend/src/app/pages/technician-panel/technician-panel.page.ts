import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription, TimeoutError, forkJoin, interval } from 'rxjs';
import { timeout } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { MyTechnicianProfile, TechnicianReview, TechniciansService } from '../../services/technicians.service';
import {
  ServiceRequest,
  ServiceMessage,
  ServiceRequestStatus,
  ServiceRequestsService,
} from '../../services/service-requests.service';

type PanelSection = 'requests' | 'jobs' | 'reviews' | 'profile';

@Component({
  selector: 'app-technician-panel',
  templateUrl: './technician-panel.page.html',
  styleUrls: ['./technician-panel.page.scss'],
  standalone: false,
})
export class TechnicianPanelPage implements OnInit, OnDestroy {
  section: PanelSection = 'requests';
  profile: MyTechnicianProfile | null = null;
  requests: ServiceRequest[] = [];
  reviews: TechnicianReview[] = [];
  isLoading = true;
  isSavingProfile = false;
  busyRequestId: string | null = null;
  errorMessage = '';
  actionMessage = '';
  profileError = '';
  chatRequest: ServiceRequest | null = null;
  chatMessages: ServiceMessage[] = [];
  messageDraft = '';
  chatLoading = false;
  chatError = '';
  isSendingMessage = false;
  private chatPolling: Subscription | null = null;
  profileForm = {
    profession: '',
    yearsExperience: 0,
    certifications: '',
    bio: '',
    isAvailable: true,
  };

  private readonly transitions: Record<ServiceRequestStatus, ServiceRequestStatus[]> = {
    SOLICITADO: [],
    CANCELADO: [],
    AGENDADO: ['RECIBIDO'],
    RECIBIDO: ['EN_PROCESO'],
    EN_PROCESO: ['ESPERANDO_PIEZA', 'LISTO_PARA_ENTREGA'],
    ESPERANDO_PIEZA: ['EN_PROCESO'],
    LISTO_PARA_ENTREGA: ['ENTREGADO'],
    ENTREGADO: ['EN_GARANTIA', 'CERRADO'],
    EN_GARANTIA: ['RESUELTO'],
    RESUELTO: ['CERRADO'],
    CERRADO: [],
  };

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly techniciansService: TechniciansService,
    private readonly serviceRequests: ServiceRequestsService,
  ) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  ngOnDestroy(): void {
    this.chatPolling?.unsubscribe();
  }

  get technicianName(): string {
    return this.profile?.name || this.authService.getUser()?.name || 'Técnico';
  }

  get openRequests(): ServiceRequest[] {
    return this.requests.filter((request) => request.technicianId === null && request.status === 'SOLICITADO');
  }

  get myJobs(): ServiceRequest[] {
    return this.requests.filter((request) => request.technicianId === this.profile?.id);
  }

  get activeJobs(): number {
    return this.myJobs.filter((request) => !['CERRADO', 'CANCELADO'].includes(request.status)).length;
  }

  get completedJobs(): number {
    return this.myJobs.filter((request) => ['CERRADO', 'RESUELTO'].includes(request.status)).length;
  }

  get averageRating(): number {
    if (!this.reviews.length) return 0;
    return this.reviews.reduce((total, review) => total + review.rating, 0) / this.reviews.length;
  }

  loadDashboard(): void {
    this.isLoading = true;
    this.errorMessage = '';
    forkJoin({
      profile: this.techniciansService.getMyProfile(),
      requests: this.serviceRequests.findAll(),
      reviews: this.techniciansService.getMyReviews(),
    })
      .pipe(timeout(20000))
      .subscribe({
        next: ({ profile, requests, reviews }) => {
          this.profile = profile;
          this.requests = requests;
          this.reviews = reviews;
          this.profileForm = {
            profession: profile.profile.profession ?? '',
            yearsExperience: profile.profile.yearsExperience ?? 0,
            certifications: profile.profile.certifications ?? '',
            bio: profile.profile.bio ?? '',
            isAvailable: profile.profile.isAvailable,
          };
          this.isLoading = false;
        },
        error: (error: unknown) => {
          this.isLoading = false;
          this.errorMessage = this.errorFor(error, 'No se pudo cargar tu panel técnico.');
        },
      });
  }

  setSection(section: PanelSection): void {
    this.section = section;
    this.actionMessage = '';
    this.profileError = '';
  }

  openConversation(request: ServiceRequest): void {
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
    this.serviceRequests.getMessages(this.chatRequest.id).pipe(timeout(15000)).subscribe({
      next: (messages) => {
        this.chatMessages = messages;
        this.chatLoading = false;
        this.chatError = '';
      },
      error: (error: unknown) => {
        this.chatLoading = false;
        this.chatError = this.errorFor(error, 'No se pudo cargar la conversación.');
      },
    });
  }

  sendMessage(): void {
    if (!this.chatRequest || !this.messageDraft.trim() || this.isSendingMessage) return;
    this.isSendingMessage = true;
    this.serviceRequests.sendMessage(this.chatRequest.id, this.messageDraft.trim()).pipe(timeout(15000)).subscribe({
      next: () => {
        this.messageDraft = '';
        this.isSendingMessage = false;
        this.refreshConversation(false);
      },
      error: (error: unknown) => {
        this.isSendingMessage = false;
        this.chatError = this.errorFor(error, 'No se pudo enviar el mensaje.');
      },
    });
  }

  getStars(rating: number): string {
    return '★'.repeat(Math.max(0, Math.min(5, rating))) + '☆'.repeat(Math.max(0, 5 - rating));
  }

  acceptRequest(request: ServiceRequest): void {
    if (this.busyRequestId) return;
    this.busyRequestId = request.id;
    this.actionMessage = '';
    this.serviceRequests.accept(request.id).pipe(timeout(20000)).subscribe({
      next: () => {
        this.busyRequestId = null;
        this.actionMessage = 'Solicitud aceptada. Ya aparece en tus trabajos.';
        this.loadDashboard();
        this.section = 'jobs';
      },
      error: (error: unknown) => {
        this.busyRequestId = null;
        this.actionMessage = this.errorFor(error, 'No se pudo aceptar la solicitud. Actualiza e inténtalo de nuevo.');
      },
    });
  }

  advanceRequest(request: ServiceRequest, status: ServiceRequestStatus): void {
    if (this.busyRequestId) return;
    this.busyRequestId = request.id;
    this.actionMessage = '';
    this.serviceRequests.updateStatus(request.id, status).pipe(timeout(20000)).subscribe({
      next: () => {
        this.busyRequestId = null;
        this.actionMessage = 'El estado del trabajo se actualizó.';
        this.loadDashboard();
      },
      error: (error: unknown) => {
        this.busyRequestId = null;
        this.actionMessage = this.errorFor(error, 'No se pudo actualizar el trabajo. Actualiza e inténtalo de nuevo.');
      },
    });
  }

  saveProfile(): void {
    if (this.isSavingProfile || !this.profile) return;
    this.profileError = '';
    this.isSavingProfile = true;
    this.techniciansService.updateMyProfile({
      profession: this.profileForm.profession.trim(),
      yearsExperience: Number(this.profileForm.yearsExperience),
      certifications: this.profileForm.certifications.trim() || null,
      bio: this.profileForm.bio.trim(),
      isAvailable: this.profileForm.isAvailable,
    }).pipe(timeout(20000)).subscribe({
      next: (profile) => {
        this.profile = profile;
        this.profileForm.isAvailable = profile.profile.isAvailable;
        this.isSavingProfile = false;
        this.actionMessage = 'Tu perfil técnico se guardó correctamente.';
        this.loadDashboard();
      },
      error: (error: unknown) => {
        this.isSavingProfile = false;
        this.profileError = this.errorFor(error, 'No se pudo guardar tu perfil. Revisa los datos e inténtalo de nuevo.');
      },
    });
  }

  nextStatuses(status: ServiceRequestStatus): ServiceRequestStatus[] {
    return this.transitions[status] ?? [];
  }

  statusLabel(status: ServiceRequestStatus): string {
    const labels: Record<ServiceRequestStatus, string> = {
      SOLICITADO: 'Disponible',
      CANCELADO: 'Cancelado',
      AGENDADO: 'Agendado',
      RECIBIDO: 'Recibido',
      EN_PROCESO: 'En proceso',
      ESPERANDO_PIEZA: 'Esperando pieza',
      LISTO_PARA_ENTREGA: 'Listo para entrega',
      ENTREGADO: 'Entregado',
      EN_GARANTIA: 'En garantía',
      RESUELTO: 'Resuelto',
      CERRADO: 'Cerrado',
    };
    return labels[status];
  }

  statusActionLabel(status: ServiceRequestStatus): string {
    const labels: Partial<Record<ServiceRequestStatus, string>> = {
      RECIBIDO: 'Confirmar recepción',
      EN_PROCESO: 'Iniciar reparación',
      ESPERANDO_PIEZA: 'Esperar pieza',
      LISTO_PARA_ENTREGA: 'Marcar listo para entrega',
      ENTREGADO: 'Confirmar entrega',
      EN_GARANTIA: 'Enviar a garantía',
      RESUELTO: 'Marcar resuelto',
      CERRADO: 'Cerrar trabajo',
    };
    return labels[status] ?? this.statusLabel(status);
  }

  requestAddress(request: ServiceRequest): string {
    const client = request.client;
    if (!client) return '';
    return [
      client.street && client.exteriorNumber ? `${client.street} ${client.exteriorNumber}` : client.street || client.exteriorNumber,
      client.interiorNumber ? `Int. ${client.interiorNumber}` : null,
      client.neighborhood,
      client.municipality,
      client.state,
    ].filter(Boolean).join(', ');
  }

  logout(): void {
    this.authService.logout();
    void this.router.navigateByUrl('/login', { replaceUrl: true });
  }

  private errorFor(error: unknown, fallback: string): string {
    if (error instanceof TimeoutError) return 'El servidor tardó demasiado en responder. Intenta de nuevo.';
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) return 'No hay conexión con el backend.';
      if (error.status === 403) return 'Tu cuenta no tiene permiso para realizar esta acción.';
      if (error.status === 409 || error.status === 400) {
        return typeof error.error?.message === 'string'
          ? error.error.message
          : 'La solicitud cambió. Actualiza el panel antes de continuar.';
      }
      if (typeof error.error?.message === 'string') return error.error.message;
    }
    return fallback;
  }
}
