import {
  Controller,
  Get,
  Param,
  Query,
} from '@nestjs/common';
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

@ApiTags('Technicians')
@ApiBearerAuth()
@Controller('technicians')
export class TechniciansController {
  constructor(
    private readonly techniciansService: TechniciansService,
  ) {}

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