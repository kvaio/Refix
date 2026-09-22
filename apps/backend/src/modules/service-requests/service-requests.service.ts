import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  CreateServiceRequestDto,
} from './dto/create-service-request.dto';

import {
  ServiceRequestStatus,
  UpdateServiceRequestStatusDto,
} from './dto/update-service-request-status.dto';

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
      status: ServiceRequestStatus.PENDING,
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
          request.technicianId === null ||
          request.technicianId === user.id,
      );
    }

    return this.requests.filter(
      (request) => request.clientId === user.id,
    );
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

    if (request.status !== ServiceRequestStatus.PENDING) {
      throw new BadRequestException(
        'Solo una solicitud pendiente puede ser aceptada',
      );
    }

    if (request.technicianId !== null) {
      throw new BadRequestException(
        'La solicitud ya tiene un técnico asignado',
      );
    }

    request.technicianId = user.id;
    request.status = ServiceRequestStatus.ACCEPTED;
    request.updatedAt = new Date().toISOString();

    return request;
  }

  reject(id: string) {
    const request = this.findRequest(id);

    if (request.status !== ServiceRequestStatus.PENDING) {
      throw new BadRequestException(
        'Solo una solicitud pendiente puede ser rechazada',
      );
    }

    request.status = ServiceRequestStatus.REJECTED;
    request.updatedAt = new Date().toISOString();

    return request;
  }

  updateStatus(
    id: string,
    dto: UpdateServiceRequestStatusDto,
    user: AuthUser,
  ) {
    const request = this.findRequest(id);

    const isOwner =
      request.technicianId === user.id;

    const isAdmin =
      user.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException(
        'No puedes modificar esta solicitud',
      );
    }

    this.validateStatusTransition(
      request.status,
      dto.status,
    );

    request.status = dto.status;
    request.updatedAt = new Date().toISOString();

    return request;
  }

  private validateStatusTransition(
    currentStatus: ServiceRequestStatus,
    nextStatus: ServiceRequestStatus,
  ) {
    const allowedTransitions: Record<
      ServiceRequestStatus,
      ServiceRequestStatus[]
    > = {
      [ServiceRequestStatus.PENDING]: [
        ServiceRequestStatus.REJECTED,
      ],
      [ServiceRequestStatus.ACCEPTED]: [
        ServiceRequestStatus.IN_PROGRESS,
      ],
      [ServiceRequestStatus.IN_PROGRESS]: [
        ServiceRequestStatus.COMPLETED,
      ],
      [ServiceRequestStatus.COMPLETED]: [],
      [ServiceRequestStatus.REJECTED]: [],
      [ServiceRequestStatus.CANCELLED]: [],
    };

    const allowed =
      allowedTransitions[currentStatus];

    if (!allowed.includes(nextStatus)) {
      throw new BadRequestException(
        `Transición de estado no permitida: ${currentStatus} → ${nextStatus}`,
      );
    }
  }

  private findRequest(id: string) {
    const request = this.requests.find(
      (item) => item.id === id,
    );

    if (!request) {
      throw new NotFoundException(
        'Solicitud de servicio no encontrada',
      );
    }

    return request;
  }
}