import { ApiProperty } from '@nestjs/swagger';
import {
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsString,
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

  @ApiProperty({
    example: 20.6534,
    description: 'Latitud de la ubicación del cliente.',
  })
  @IsLatitude()
  latitude: number;

  @ApiProperty({
    example: -103.3496,
    description: 'Longitud de la ubicación del cliente.',
  })
  @IsLongitude()
  longitude: number;
}