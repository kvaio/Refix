import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { CreateServiceRequestDto } from './dto/create-service-request.dto';
import { UpdateServiceRequestStatusDto } from './dto/update-service-request-status.dto';

import { ServiceRequestStatus } from './domain/service-request-status';
import { canTransition } from './domain/service-request-status.machine';
import { ServiceRequestStatusHistory } from './domain/service-request-status-history';

interface AuthUser {
  id: string;
  email: string;
  role: string;
}

export interface ServiceRequest {
  id: string;
  clientId: string;
  technicianId: string | null;
  title: string;
  description: string;
  deviceType: string;
  latitude: number;
  longitude: number;
  status: ServiceRequestStatus;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class ServiceRequestsService {
  private readonly requests: ServiceRequest[] = [];

  private readonly statusHistory = new Map<
    string,
    ServiceRequestStatusHistory[]
  >();

  create(dto: CreateServiceRequestDto, user: AuthUser) {
    if (user.role !== 'CLIENT') {
      throw new ForbiddenException('Solo un cliente puede crear una solicitud');
    }

    const now = new Date().toISOString();

    const request: ServiceRequest = {
      id: crypto.randomUUID(),
      clientId: user.id,
      technicianId: null,
      title: dto.title,
      description: dto.description,
      deviceType: dto.deviceType,
      latitude: dto.latitude,
      longitude: dto.longitude,
      status: ServiceRequestStatus.SOLICITADO,
      createdAt: now,
      updatedAt: now,
    };

    this.requests.push(request);

    this.recordStatusHistory(request.id, null, request.status, user);

    return request;
  }

  findAll(user: AuthUser) {
    if (user.role === 'ADMIN') {
      return this.requests;
    }

    if (user.role === 'TECHNICIAN') {
      return this.requests.filter(
        (request) =>
          request.technicianId === null || request.technicianId === user.id,
      );
    }

    return this.requests.filter((request) => request.clientId === user.id);
  }

  findOne(id: string, user: AuthUser) {
    const request = this.findRequest(id);

    const canAccess =
      user.role === 'ADMIN' ||
      request.clientId === user.id ||
      request.technicianId === user.id;

    if (!canAccess) {
      throw new ForbiddenException(
        'No tienes permisos para consultar esta solicitud',
      );
    }

    return request;
  }

  getHistory(id: string, user: AuthUser) {
    const request = this.findRequest(id);

    const canAccess =
      user.role === 'ADMIN' ||
      request.clientId === user.id ||
      request.technicianId === user.id;

    if (!canAccess) {
      throw new ForbiddenException(
        'No tienes permisos para consultar el historial de esta solicitud',
      );
    }

    return this.statusHistory.get(id) ?? [];
  }

  accept(id: string, user: AuthUser) {
    if (user.role !== 'TECHNICIAN') {
      throw new ForbiddenException(
        'Solo un técnico puede aceptar una solicitud',
      );
    }

    const request = this.findRequest(id);

    if (!canTransition(request.status, ServiceRequestStatus.AGENDADO)) {
      throw new BadRequestException(
        `Transición de estado no permitida: ${request.status} → ${ServiceRequestStatus.AGENDADO}`,
      );
    }

    if (request.technicianId !== null) {
      throw new BadRequestException(
        'La solicitud ya tiene un técnico asignado',
      );
    }

    request.technicianId = user.id;
    request.status = ServiceRequestStatus.AGENDADO;
    request.updatedAt = new Date().toISOString();

    this.recordStatusHistory(
      request.id,
      ServiceRequestStatus.SOLICITADO,
      ServiceRequestStatus.AGENDADO,
      user,
    );

    return request;
  }

  reject(id: string, user: AuthUser) {
    if (user.role !== 'TECHNICIAN') {
      throw new ForbiddenException(
        'Solo un técnico puede rechazar una solicitud',
      );
    }

    const request = this.findRequest(id);

    if (!canTransition(request.status, ServiceRequestStatus.CANCELADO)) {
      throw new BadRequestException(
        `Transición de estado no permitida: ${request.status} → ${ServiceRequestStatus.CANCELADO}`,
      );
    }

    request.status = ServiceRequestStatus.CANCELADO;
    request.updatedAt = new Date().toISOString();

    this.recordStatusHistory(
      request.id,
      ServiceRequestStatus.SOLICITADO,
      ServiceRequestStatus.CANCELADO,
      user,
    );

    return request;
  }

  updateStatus(id: string, dto: UpdateServiceRequestStatusDto, user: AuthUser) {
    if (user.role !== 'TECHNICIAN' && user.role !== 'ADMIN') {
      throw new ForbiddenException(
        'Solo un técnico o administrador puede actualizar el estado',
      );
    }

    const request = this.findRequest(id);

    const isOwner = request.technicianId === user.id;
    const isAdmin = user.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('No puedes modificar esta solicitud');
    }

    if (!canTransition(request.status, dto.status)) {
      throw new BadRequestException(
        `Transición de estado no permitida: ${request.status} → ${dto.status}`,
      );
    }

    const previousStatus = request.status;

    request.status = dto.status;
    request.updatedAt = new Date().toISOString();

    this.recordStatusHistory(request.id, previousStatus, request.status, user);

    return request;
  }

  private recordStatusHistory(
    serviceRequestId: string,
    previousStatus: ServiceRequestStatus | null,
    newStatus: ServiceRequestStatus,
    user: AuthUser,
  ) {
    const historyEntry: ServiceRequestStatusHistory = {
      id: crypto.randomUUID(),
      serviceRequestId,
      previousStatus,
      newStatus,
      actorId: user.id,
      actorRole: user.role,
      createdAt: new Date().toISOString(),
    };

    const history = this.statusHistory.get(serviceRequestId) ?? [];

    history.push(historyEntry);

    this.statusHistory.set(serviceRequestId, history);
  }

  private findRequest(id: string) {
    const request = this.requests.find((item) => item.id === id);

    if (!request) {
      throw new NotFoundException('Solicitud de servicio no encontrada');
    }

    return request;
  }
}
