import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Request } from 'express';

import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles/roles.guard';

import { CreateServiceRequestDto } from './dto/create-service-request.dto';
import { UpdateServiceRequestStatusDto } from './dto/update-service-request-status.dto';
import { ServiceRequestsService } from './service-requests.service';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

@ApiTags('Service Requests')
@ApiBearerAuth()
@Controller('service-requests')
export class ServiceRequestsController {
  constructor(
    private readonly serviceRequestsService: ServiceRequestsService,
  ) {}

  @Post()
  @Roles('CLIENT')
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary: 'Crear una solicitud de servicio',
    description: 'Crea una nueva solicitud en estado SOLICITADO.',
  })
  @ApiResponse({
    status: 201,
    description: 'Solicitud creada correctamente.',
  })
  @ApiBadRequestResponse({
    description: 'Datos inválidos.',
  })
  @ApiUnauthorizedResponse({
    description: 'JWT inválido o ausente.',
  })
  @ApiForbiddenResponse({
    description: 'El usuario no tiene rol CLIENT.',
  })
  create(
    @Body() dto: CreateServiceRequestDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.serviceRequestsService.create(dto, req.user);
  }

  @Get()
  @ApiOperation({
    summary: 'Obtener solicitudes de servicio',
    description:
      'Devuelve las solicitudes visibles para el usuario autenticado según su rol.',
  })
  @ApiResponse({
    status: 200,
    description: 'Solicitudes obtenidas correctamente.',
  })
  @ApiUnauthorizedResponse({
    description: 'JWT inválido o ausente.',
  })
  findAll(@Req() req: AuthenticatedRequest) {
    return this.serviceRequestsService.findAll(req.user);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener una solicitud por ID',
  })
  @ApiParam({
    name: 'id',
    description: 'Identificador UUID de la solicitud.',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Solicitud obtenida correctamente.',
  })
  @ApiUnauthorizedResponse({
    description: 'JWT inválido o ausente.',
  })
  @ApiForbiddenResponse({
    description: 'El usuario no tiene acceso a esta solicitud.',
  })
  @ApiNotFoundResponse({
    description: 'Solicitud no encontrada.',
  })
  findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.serviceRequestsService.findOne(id, req.user);
  }

  @Patch(':id/accept')
  @Roles('TECHNICIAN')
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary: 'Aceptar una solicitud',
    description:
      'Asigna la solicitud al técnico autenticado y la mueve de SOLICITADO a AGENDADO.',
  })
  @ApiParam({
    name: 'id',
    description: 'Identificador de la solicitud.',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Solicitud aceptada correctamente.',
  })
  @ApiBadRequestResponse({
    description:
      'La solicitud no puede ser aceptada por su estado actual o ya tiene un técnico asignado.',
  })
  @ApiUnauthorizedResponse({
    description: 'JWT inválido o ausente.',
  })
  @ApiForbiddenResponse({
    description: 'El usuario no tiene rol TECHNICIAN.',
  })
  @ApiNotFoundResponse({
    description: 'Solicitud no encontrada.',
  })
  accept(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.serviceRequestsService.accept(id, req.user);
  }

  @Patch(':id/reject')
  @Roles('TECHNICIAN')
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary: 'Rechazar una solicitud',
    description: 'Rechaza la solicitud y la mueve de SOLICITADO a CANCELADO.',
  })
  @ApiParam({
    name: 'id',
    description: 'Identificador de la solicitud.',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Solicitud rechazada y marcada como CANCELADO.',
  })
  @ApiBadRequestResponse({
    description: 'La solicitud no puede ser rechazada por su estado actual.',
  })
  @ApiUnauthorizedResponse({
    description: 'JWT inválido o ausente.',
  })
  @ApiForbiddenResponse({
    description: 'El usuario no tiene rol TECHNICIAN.',
  })
  @ApiNotFoundResponse({
    description: 'Solicitud no encontrada.',
  })
  reject(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.serviceRequestsService.reject(id, req.user);
  }

  @Patch(':id/status')
  @Roles('TECHNICIAN', 'ADMIN')
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary: 'Actualizar estado de una solicitud',
    description:
      'Realiza una transición de estado válida según la máquina de estados de ReFix.',
  })
  @ApiParam({
    name: 'id',
    description: 'Identificador de la solicitud.',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Estado actualizado correctamente.',
  })
  @ApiBadRequestResponse({
    description:
      'El estado solicitado no puede alcanzarse desde el estado actual.',
  })
  @ApiUnauthorizedResponse({
    description: 'JWT inválido o ausente.',
  })
  @ApiForbiddenResponse({
    description: 'El usuario no tiene permisos para modificar la solicitud.',
  })
  @ApiNotFoundResponse({
    description: 'Solicitud no encontrada.',
  })
  updateStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateServiceRequestStatusDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.serviceRequestsService.updateStatus(id, dto, req.user);
  }
}
