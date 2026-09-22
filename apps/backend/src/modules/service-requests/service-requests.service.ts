import {
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

interface ServiceRequest {
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
    const request = this.requests.find(
      (item) => item.id === id,
    );

    if (!request) {
      throw new NotFoundException(
        'Solicitud de servicio no encontrada',
      );
    }

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

    request.technicianId = user.id;
    request.status = ServiceRequestStatus.ACCEPTED;
    request.updatedAt = new Date().toISOString();

    return request;
  }

  reject(id: string) {
    const request = this.findRequest(id);

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

    if (
      request.technicianId !== user.id &&
      user.role !== 'ADMIN'
    ) {
      throw new ForbiddenException(
        'No puedes modificar esta solicitud',
      );
    }

    request.status = dto.status;
    request.updatedAt = new Date().toISOString();

    return request;
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