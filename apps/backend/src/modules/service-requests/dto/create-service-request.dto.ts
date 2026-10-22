import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateServiceRequestDto {
  @ApiProperty({
    example: 'Laptop no enciende',
    description: 'Título breve del problema.',
    minLength: 5,
    maxLength: 120,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(120)
  title: string;

  @ApiProperty({
    example:
      'Mi laptop dejó de encender después de conectarla al cargador.',
    description: 'Descripción detallada del problema.',
    minLength: 10,
    maxLength: 2000,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(2000)
  description: string;

  @ApiProperty({
    example: 'Laptop',
    description: 'Tipo de dispositivo.',
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  deviceType: string;

  @ApiPropertyOptional({ maxLength: 500, description: 'Domicilio donde se requiere el servicio. Si se omite, se usa el domicilio del cliente.' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  serviceAddress?: string;

  @ApiPropertyOptional({ description: 'Identificador del técnico elegido por el cliente.' })
  @IsOptional()
  @IsUUID()
  technicianId?: string;

  @ApiPropertyOptional({
    example: 20.6534,
    description: 'Latitud de la ubicación del cliente.',
  })
  @IsOptional()
  @IsLatitude()
  latitude?: number;

  @ApiPropertyOptional({
    example: -103.3496,
    description: 'Longitud de la ubicación del cliente.',
  })
  @IsOptional()
  @IsLongitude()
  longitude?: number;
}
