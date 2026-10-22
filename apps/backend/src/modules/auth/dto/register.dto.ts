import {
  IsDateString,
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { IsAdultDate } from '../../../common/validators/is-adult-date.validator';

export class RegisterTechnicianProfileDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  profession!: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(80)
  yearsExperience!: number;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  certifications?: string;

  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  bio!: string;
}

export class RegisterDto {
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  firstNames!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(60)
  paternalSurname!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(60)
  maternalSurname!: string;

  @IsDateString()
  @IsAdultDate({ message: 'Debes tener al menos 18 años para registrarte.' })
  birthDate!: string;

  @IsIn(['FEMENINO', 'MASCULINO', 'INTERSEXUAL', 'PREFIERO_NO_DECIR'])
  sex!: string;

  @IsEmail()
  @MaxLength(254)
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password!: string;

  @IsOptional()
  @IsIn(['CLIENT', 'TECHNICIAN'])
  role?: 'CLIENT' | 'TECHNICIAN';

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsString()
  @MinLength(2)
  @MaxLength(150)
  street!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(30)
  exteriorNumber!: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  interiorNumber?: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  neighborhood!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  municipality!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  state!: string;

  @IsOptional()
  @IsString()
  @MaxLength(12)
  postalCode?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => RegisterTechnicianProfileDto)
  technicianProfile?: RegisterTechnicianProfileDto;
}
