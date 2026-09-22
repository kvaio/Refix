import { ApiProperty } from '@nestjs/swagger';
import {
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateServiceRequestDto {
  @ApiProperty({
    example: 'Laptop no enciende',
    description: 'Título breve del problema',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  title: string;

  @ApiProperty({
    example: 'Mi laptop dejó de encender después de conectarla al cargador.',
    description: 'Descripción detallada del problema',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  description: string;

  @ApiProperty({
    example: 'Laptop',
    description: 'Tipo de dispositivo',
  })
  @IsString()
  @IsNotEmpty()
  deviceType: string;

  @ApiProperty({
    example: 20.6534,
    description: 'Latitud del cliente',
  })
  @IsLatitude()
  latitude: number;

  @ApiProperty({
    example: -103.3496,
    description: 'Longitud del cliente',
  })
  @IsLongitude()
  longitude: number;
}