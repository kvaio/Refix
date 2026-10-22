import {
  Controller,
  Body,
  Get,
  Param,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles/roles.guard';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { NearbyTechniciansDto } from './dto/nearby-technicians.dto';
import { TechniciansService } from './technicians.service';
import { UpdateTechnicianProfileDto } from './dto/update-technician-profile.dto';

interface AuthenticatedTechnicianRequest extends Request {
  user: { id: string };
}

@ApiTags('Technicians')
@ApiBearerAuth()
@Controller('technicians')
export class TechniciansController {
  constructor(
    private readonly techniciansService: TechniciansService,
  ) {}

  @Get('me')
  @Roles('TECHNICIAN')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Obtener el perfil del técnico autenticado' })
  findMyProfile(@Req() req: AuthenticatedTechnicianRequest) {
    return this.techniciansService.findMyProfile(req.user.id);
  }

  @Patch('me')
  @Roles('TECHNICIAN')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Actualizar el perfil profesional del técnico autenticado' })
  updateMyProfile(
    @Body() dto: UpdateTechnicianProfileDto,
    @Req() req: AuthenticatedTechnicianRequest,
  ) {
    return this.techniciansService.updateMyProfile(req.user.id, dto);
  }

  @Get('me/reviews')
  @Roles('TECHNICIAN')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Consultar las reseñas del técnico autenticado' })
  findMyReviews(@Req() req: AuthenticatedTechnicianRequest) {
    return this.techniciansService.findMyReviews(req.user.id);
  }

  @Get()
  @ApiOperation({
    summary: 'Obtener técnicos',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de técnicos',
  })
  @ApiUnauthorizedResponse({
    description: 'JWT inválido o ausente',
  })
  findAll() {
    return this.techniciansService.findAll();
  }

  @Get('nearby')
  @ApiOperation({
    summary: 'Buscar técnicos cercanos',
  })
  @ApiResponse({
    status: 200,
    description: 'Técnicos cercanos ordenados por distancia',
  })
  @ApiUnauthorizedResponse({
    description: 'JWT inválido o ausente',
  })
  @ApiBadRequestResponse({
    description: 'Coordenadas o radio inválidos',
  })
  findNearby(
    @Query() query: NearbyTechniciansDto,
  ) {
    return this.techniciansService.findNearby(
      query.latitude,
      query.longitude,
      query.radiusKm,
    );
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener un técnico por ID',
  })
  @ApiParam({
    name: 'id',
    example: 'tech-001',
  })
  @ApiResponse({
    status: 200,
    description: 'Técnico encontrado',
  })
  @ApiUnauthorizedResponse({
    description: 'JWT inválido o ausente',
  })
  @ApiNotFoundResponse({
    description: 'Técnico no encontrado',
  })
  findOne(@Param('id') id: string) {
    return this.techniciansService.findOne(id);
  }
}
