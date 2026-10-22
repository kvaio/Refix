import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateTechnicianProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  profession?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(80)
  yearsExperience?: number;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  certifications?: string | null;

  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  bio?: string;

  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;
}
