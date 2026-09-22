import {
  Controller,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
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
  findAll() {
    return this.techniciansService.findAll();
  }

  @Get('nearby')
  @ApiOperation({
    summary: 'Buscar técnicos cercanos',
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
  findOne(@Param('id') id: string) {
    return this.techniciansService.findOne(id);
  }
}