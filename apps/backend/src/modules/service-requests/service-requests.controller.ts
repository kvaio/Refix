import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
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
  })
  create(
    @Body() dto: CreateServiceRequestDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.serviceRequestsService.create(
      dto,
      req.user,
    );
  }

  @Get()
  @ApiOperation({
    summary: 'Obtener solicitudes disponibles o propias',
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
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  findOne(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.serviceRequestsService.findOne(
      id,
      req.user,
    );
  }

  @Patch(':id/accept')
  @Roles('TECHNICIAN')
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary: 'Aceptar una solicitud',
  })
  accept(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.serviceRequestsService.accept(
      id,
      req.user,
    );
  }

  @Patch(':id/reject')
  @Roles('TECHNICIAN')
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary: 'Rechazar una solicitud',
  })
  reject(@Param('id') id: string) {
    return this.serviceRequestsService.reject(id);
  }

  @Patch(':id/status')
  @Roles('TECHNICIAN', 'ADMIN')
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary: 'Actualizar estado de una solicitud',
  })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateServiceRequestStatusDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.serviceRequestsService.updateStatus(
      id,
      dto,
      req.user,
    );
  }
}