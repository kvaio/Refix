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

class UpdateTechnicianProfileDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(120)
  profession?: string;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(80)
  yearsExperience?: number;

  @IsOptional() @IsString() @MaxLength(4000)
  certifications?: string | null;

  @IsOptional() @IsString() @MinLength(10) @MaxLength(2000)
  bio?: string;

}

export class UpdateAdminAccountDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(80)
  firstNames?: string;

  @IsOptional() @IsString() @MinLength(2) @MaxLength(60)
  paternalSurname?: string;

  @IsOptional() @IsString() @MinLength(2) @MaxLength(60)
  maternalSurname?: string;

  @IsOptional() @IsDateString() @IsAdultDate({ message: 'La cuenta debe corresponder a una persona de 18 años o más.' })
  birthDate?: string;

  @IsOptional() @IsIn(['FEMENINO', 'MASCULINO', 'INTERSEXUAL', 'PREFIERO_NO_DECIR'])
  sex?: string;

  @IsOptional() @IsEmail() @MaxLength(254)
  email?: string;

  @IsOptional() @IsString() @MinLength(8) @MaxLength(72)
  password?: string;

  @IsOptional() @IsString() @MaxLength(30)
  phone?: string | null;

  @IsOptional() @IsString() @MinLength(2) @MaxLength(150)
  street?: string;

  @IsOptional() @IsString() @MaxLength(30)
  exteriorNumber?: string;

  @IsOptional() @IsString() @MaxLength(30)
  interiorNumber?: string | null;

  @IsOptional() @IsString() @MinLength(2) @MaxLength(120)
  neighborhood?: string;

  @IsOptional() @IsString() @MinLength(2) @MaxLength(120)
  municipality?: string;

  @IsOptional() @IsString() @MinLength(2) @MaxLength(120)
  state?: string;

  @IsOptional() @IsString() @MaxLength(12)
  postalCode?: string | null;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateTechnicianProfileDto)
  technicianProfile?: UpdateTechnicianProfileDto;
}
