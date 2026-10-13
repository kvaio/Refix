import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsLatitude,
  IsLongitude,
  IsNumber,
  IsOptional,
  Max,
  Min,
} from 'class-validator';

export class NearbyTechniciansDto {
  @ApiProperty({
    example: 20.6534,
    description: 'Latitud de la ubicación del cliente',
  })
  @Type(() => Number)
  @IsLatitude()
  latitude: number;

  @ApiProperty({
    example: -103.3496,
    description: 'Longitud de la ubicación del cliente',
  })
  @Type(() => Number)
  @IsLongitude()
  longitude: number;

  @ApiProperty({
    example: 10,
    required: false,
    description: 'Radio de búsqueda en kilómetros',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  radiusKm = 10;
}