import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export enum ServiceRequestStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  REJECTED = 'REJECTED',
}

export class UpdateServiceRequestStatusDto {
  @ApiProperty({
    enum: ServiceRequestStatus,
    example: ServiceRequestStatus.IN_PROGRESS,
  })
  @IsEnum(ServiceRequestStatus)
  status: ServiceRequestStatus;
}