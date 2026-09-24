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

  create(dto: CreateServiceRequestDto, user: AuthUser) {
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

  accept(id: string, user: AuthUser) {
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
    return request;
  }
  reject(id: string) {
    const request = this.findRequest(id);
    if (!canTransition(request.status, ServiceRequestStatus.CANCELADO)) {
      throw new BadRequestException(
        `Transición de estado no permitida: ${request.status} → ${ServiceRequestStatus.CANCELADO}`,
      );
    }

    request.status = ServiceRequestStatus.CANCELADO;
    request.updatedAt = new Date().toISOString();
    return request;
  }

  updateStatus(id: string, dto: UpdateServiceRequestStatusDto, user: AuthUser) {
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

    request.status = dto.status;
    request.updatedAt = new Date().toISOString();

    return request;
  }

  private findRequest(id: string) {
    const request = this.requests.find((item) => item.id === id);

    if (!request) {
      throw new NotFoundException('Solicitud de servicio no encontrada');
    }

    return request;
  }
}
