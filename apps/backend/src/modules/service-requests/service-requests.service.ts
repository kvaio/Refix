import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, RequestStatus, Role } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { CreateServiceRequestDto } from './dto/create-service-request.dto';
import { UpdateServiceRequestStatusDto } from './dto/update-service-request-status.dto';
import { ServiceRequestStatus } from './domain/service-request-status';
import { canTransition } from './domain/service-request-status.machine';
import { isAdultDate } from '../../common/validators/is-adult-date.validator';
import { CreateServiceMessageDto } from './dto/create-service-message.dto';
import { CreateServiceReviewDto } from './dto/create-service-review.dto';

interface AuthUser {
  id: string;
  email: string;
  role: string;
}

@Injectable()
export class ServiceRequestsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateServiceRequestDto, user: AuthUser) {
    if (user.role !== 'CLIENT') {
      throw new ForbiddenException(
        'Solo un cliente puede crear una solicitud',
      );
    }

    await this.ensureAdult(user.id, 'contratar un servicio');

    let selectedTechnicianId: string | null = null;
    if (dto.technicianId) {
      const technician = await this.prisma.user.findFirst({
        where: {
          id: dto.technicianId,
          role: Role.TECHNICIAN,
          isActive: true,
          technicianProfile: { is: { isAvailable: true } },
        },
        select: { id: true },
      });
      if (!technician) {
        throw new BadRequestException('El técnico seleccionado ya no está disponible. Actualiza la lista e inténtalo de nuevo.');
      }
      selectedTechnicianId = technician.id;
    }

    return this.prisma.$transaction(async (tx) => {
      const client = await tx.user.findUnique({
        where: { id: user.id },
        select: {
          street: true, exteriorNumber: true, interiorNumber: true,
          neighborhood: true, municipality: true, state: true, postalCode: true,
        },
      });
      const profileAddress = client
        ? [
            client.street && client.exteriorNumber ? `${client.street} ${client.exteriorNumber}` : client.street || client.exteriorNumber,
            client.interiorNumber ? `Int. ${client.interiorNumber}` : null,
            client.neighborhood, client.municipality, client.state, client.postalCode,
          ].filter(Boolean).join(', ')
        : null;
      const request = await tx.serviceRequest.create({
        data: {
          clientId: user.id,
          technicianId: selectedTechnicianId,
          title: dto.title,
          description: dto.description,
          deviceType: dto.deviceType,
          serviceAddress: dto.serviceAddress?.trim() || profileAddress || null,
          latitude: dto.latitude ?? null,
          longitude: dto.longitude ?? null,
          status: RequestStatus.SOLICITADO,
        },
      });

      await tx.serviceRequestStatusHistory.create({
        data: {
          serviceRequestId: request.id,
          previousStatus: null,
          newStatus: RequestStatus.SOLICITADO,
          actorId: user.id,
          actorRole: this.toPrismaRole(user.role),
        },
      });

      return request;
    });
  }

  async findAll(user: AuthUser) {
    let where: Prisma.ServiceRequestWhereInput;

    if (user.role === 'ADMIN') {
      where = {};
    } else if (user.role === 'TECHNICIAN') {
      where = {
        OR: [
          { technicianId: user.id },
          { technicianId: null, status: RequestStatus.SOLICITADO },
        ],
      };
    } else {
      where = { clientId: user.id };
    }

    const requests = await this.prisma.serviceRequest.findMany({
      where,
      include: {
        client: {
          select: {
            name: true,
            phone: true,
            street: true,
            exteriorNumber: true,
            interiorNumber: true,
            neighborhood: true,
            municipality: true,
            state: true,
          },
        },
        technician: {
          select: {
            id: true,
            name: true,
            technicianProfile: { select: { profession: true } },
          },
        },
        review: { select: { id: true, rating: true, comment: true, createdAt: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    if (user.role !== 'TECHNICIAN') return requests;
    return requests.map((request) =>
      request.technicianId === user.id
        ? request
        : { ...request, client: null },
    );
  }

  async findOne(id: string, user: AuthUser) {
    const request = await this.findRequest(id);
    this.ensureCanAccess(request, user);
    return request;
  }

  async getHistory(id: string, user: AuthUser) {
    const request = await this.findRequest(id);
    this.ensureCanAccess(request, user);

    return this.prisma.serviceRequestStatusHistory.findMany({
      where: { serviceRequestId: id },
      orderBy: { createdAt: 'asc' },
    });
  }

  async accept(id: string, user: AuthUser) {
    if (user.role !== 'TECHNICIAN') {
      throw new ForbiddenException(
        'Solo un técnico puede aceptar una solicitud',
      );
    }

    await this.ensureAdult(user.id, 'aceptar un servicio');
    const technicianProfile = await this.prisma.technicianProfile.findUnique({
      where: { userId: user.id },
      select: { isAvailable: true },
    });
    if (!technicianProfile?.isAvailable) {
      throw new ForbiddenException('Activa tu disponibilidad antes de aceptar solicitudes.');
    }

    return this.prisma.$transaction(async (tx) => {
      const request = await tx.serviceRequest.findUnique({
        where: { id },
      });

      if (!request) {
        throw new NotFoundException(
          'Solicitud de servicio no encontrada',
        );
      }

      if (
        !canTransition(
          request.status as ServiceRequestStatus,
          ServiceRequestStatus.AGENDADO,
        )
      ) {
        throw new BadRequestException(
          `Transición de estado no permitida: ${request.status} → AGENDADO`,
        );
      }

      if (request.technicianId !== null && request.technicianId !== user.id) {
        throw new BadRequestException(
          'La solicitud ya tiene un técnico asignado',
        );
      }

      const result = await tx.serviceRequest.updateMany({
        where: {
          id,
          status: RequestStatus.SOLICITADO,
          technicianId: request.technicianId,
        },
        data: {
          technicianId: user.id,
          status: RequestStatus.AGENDADO,
        },
      });

      if (result.count !== 1) {
        throw new BadRequestException(
          'La solicitud cambió mientras intentabas aceptarla. Actualiza la lista e inténtalo de nuevo.',
        );
      }

      await tx.serviceRequestStatusHistory.create({
        data: {
          serviceRequestId: id,
          previousStatus: RequestStatus.SOLICITADO,
          newStatus: RequestStatus.AGENDADO,
          actorId: user.id,
          actorRole: this.toPrismaRole(user.role),
        },
      });

      return tx.serviceRequest.findUniqueOrThrow({
        where: { id },
      });
    });
  }

  async reject(id: string, user: AuthUser) {
    if (user.role !== 'TECHNICIAN') {
      throw new ForbiddenException(
        'Solo un técnico puede rechazar una solicitud',
      );
    }

    return this.changeStatus(
      id,
      ServiceRequestStatus.CANCELADO,
      user,
      { requireUnassigned: true },
    );
  }

  async cancel(id: string, user: AuthUser) {
    if (user.role !== 'CLIENT') {
      throw new ForbiddenException('Solo el cliente puede cancelar su solicitud.');
    }
    return this.prisma.$transaction(async (tx) => {
      const request = await tx.serviceRequest.findUnique({ where: { id } });
      if (!request) throw new NotFoundException('Solicitud de servicio no encontrada.');
      if (request.clientId !== user.id) throw new ForbiddenException('No puedes cancelar esta solicitud.');
      if (request.status !== RequestStatus.SOLICITADO) {
        throw new BadRequestException('Solo puedes cancelar una solicitud antes de que el técnico la acepte.');
      }
      const updated = await tx.serviceRequest.updateMany({
        where: { id, clientId: user.id, status: RequestStatus.SOLICITADO },
        data: { status: RequestStatus.CANCELADO },
      });
      if (updated.count !== 1) throw new ConflictException('La solicitud cambió. Actualiza la página e inténtalo de nuevo.');
      await tx.serviceRequestStatusHistory.create({
        data: {
          serviceRequestId: id,
          previousStatus: RequestStatus.SOLICITADO,
          newStatus: RequestStatus.CANCELADO,
          actorId: user.id,
          actorRole: Role.CLIENT,
        },
      });
      return tx.serviceRequest.findUniqueOrThrow({ where: { id } });
    });
  }

  async createReview(id: string, dto: CreateServiceReviewDto, user: AuthUser) {
    if (user.role !== 'CLIENT') throw new ForbiddenException('Solo el cliente puede dejar una reseña.');
    try {
      return await this.prisma.$transaction(async (tx) => {
        const request = await tx.serviceRequest.findUnique({
          where: { id },
          select: { id: true, clientId: true, technicianId: true, status: true },
        });
        if (!request) throw new NotFoundException('Solicitud de servicio no encontrada.');
        if (request.clientId !== user.id) throw new ForbiddenException('No puedes reseñar un trabajo ajeno.');
        const reviewableStatuses: RequestStatus[] = [
          RequestStatus.ENTREGADO,
          RequestStatus.EN_GARANTIA,
          RequestStatus.RESUELTO,
          RequestStatus.CERRADO,
        ];
        if (!request.technicianId || !reviewableStatuses.includes(request.status)) {
          throw new BadRequestException('Podrás dejar una reseña cuando el trabajo haya sido entregado.');
        }
        if (await tx.review.findUnique({ where: { serviceRequestId: id }, select: { id: true } })) {
          throw new ConflictException('Ya dejaste una reseña para este trabajo.');
        }
        const review = await tx.review.create({
          data: {
            serviceRequestId: id,
            rating: dto.rating,
            comment: dto.comment?.trim() || null,
          },
        });
        const reviews = await tx.review.findMany({
          where: { serviceRequest: { technicianId: request.technicianId } },
          select: { rating: true },
        });
        const rating = reviews.reduce((sum, item) => sum + item.rating, 0) / reviews.length;
        await tx.technicianProfile.update({
          where: { userId: request.technicianId },
          data: { rating: Number(rating.toFixed(2)) },
        });
        return review;
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Ya dejaste una reseña para este trabajo.');
      }
      throw error;
    }
  }

  async getMessages(id: string, user: AuthUser) {
    const request = await this.findRequest(id);
    this.ensureCanInteract(request, user);
    return this.prisma.serviceMessage.findMany({
      where: { serviceRequestId: id },
      include: { sender: { select: { id: true, name: true, role: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async sendMessage(id: string, dto: CreateServiceMessageDto, user: AuthUser) {
    const request = await this.findRequest(id);
    this.ensureCanInteract(request, user);
    if (request.status === RequestStatus.CANCELADO) {
      throw new BadRequestException('No se pueden enviar mensajes en una solicitud cancelada.');
    }
    const body = dto.body.trim();
    if (!body) throw new BadRequestException('El mensaje no puede estar vacío.');
    return this.prisma.serviceMessage.create({
      data: { serviceRequestId: id, senderId: user.id, body },
      include: { sender: { select: { id: true, name: true, role: true } } },
    });
  }

  async updateStatus(
    id: string,
    dto: UpdateServiceRequestStatusDto,
    user: AuthUser,
  ) {
    if (user.role !== 'TECHNICIAN' && user.role !== 'ADMIN') {
      throw new ForbiddenException(
        'Solo un técnico o administrador puede actualizar el estado',
      );
    }

    return this.changeStatus(id, dto.status, user);
  }

  private async changeStatus(
    id: string,
    nextStatus: ServiceRequestStatus,
    user: AuthUser,
    options: { requireUnassigned?: boolean } = {},
  ) {
    return this.prisma.$transaction(async (tx) => {
      const request = await tx.serviceRequest.findUnique({
        where: { id },
      });

      if (!request) {
        throw new NotFoundException(
          'Solicitud de servicio no encontrada',
        );
      }

      if (user.role === 'TECHNICIAN') {
        if (options.requireUnassigned) {
          if (request.technicianId !== null) {
            throw new ForbiddenException(
              'No puedes rechazar una solicitud asignada a otro técnico',
            );
          }
        } else if (request.technicianId !== user.id) {
          throw new ForbiddenException(
            'No puedes modificar esta solicitud',
          );
        }
      }

      const previousStatus = request.status as ServiceRequestStatus;

      if (!canTransition(previousStatus, nextStatus)) {
        throw new BadRequestException(
          `Transición de estado no permitida: ${previousStatus} → ${nextStatus}`,
        );
      }

      const result = await tx.serviceRequest.updateMany({
        where: {
          id,
          status: request.status,
          ...(options.requireUnassigned ? { technicianId: null } : {}),
        },
        data: {
          status: nextStatus as RequestStatus,
        },
      });

      if (result.count !== 1) {
        throw new BadRequestException(
          'La solicitud cambió mientras se procesaba. Actualiza los datos e inténtalo de nuevo.',
        );
      }

      await tx.serviceRequestStatusHistory.create({
        data: {
          serviceRequestId: id,
          previousStatus: request.status,
          newStatus: nextStatus as RequestStatus,
          actorId: user.id,
          actorRole: this.toPrismaRole(user.role),
        },
      });

      return tx.serviceRequest.findUniqueOrThrow({
        where: { id },
      });
    });
  }

  private async findRequest(id: string) {
    const request = await this.prisma.serviceRequest.findUnique({
      where: { id },
    });

    if (!request) {
      throw new NotFoundException(
        'Solicitud de servicio no encontrada',
      );
    }

    return request;
  }

  private async ensureAdult(userId: string, action: string): Promise<void> {
    const account = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { birthDate: true },
    });
    if (!account?.birthDate || !isAdultDate(account.birthDate)) {
      throw new ForbiddenException(`Debes tener al menos 18 años para ${action}.`);
    }
  }

  private ensureCanAccess(
    request: { clientId: string; technicianId: string | null },
    user: AuthUser,
  ) {
    const canAccess =
      user.role === 'ADMIN' ||
      request.clientId === user.id ||
      request.technicianId === user.id;

    if (!canAccess) {
      throw new ForbiddenException(
        'No tienes permisos para consultar esta solicitud',
      );
    }
  }

  private ensureCanInteract(
    request: { clientId: string; technicianId: string | null },
    user: AuthUser,
  ): void {
    const isParticipant =
      (user.role === 'CLIENT' && request.clientId === user.id) ||
      (user.role === 'TECHNICIAN' && request.technicianId === user.id);
    if (!isParticipant) {
      throw new ForbiddenException('La conversación solo está disponible para el cliente y el técnico asignado.');
    }
  }

  private toPrismaRole(role: string): Role {
    if (role === 'CLIENT') return Role.CLIENT;
    if (role === 'TECHNICIAN') return Role.TECHNICIAN;
    if (role === 'ADMIN') return Role.ADMIN;

    throw new ForbiddenException('Rol de usuario no válido');
  }
}
