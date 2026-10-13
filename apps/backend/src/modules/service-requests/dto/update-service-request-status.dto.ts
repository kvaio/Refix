import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

import { ServiceRequestStatus } from '../domain/service-request-status';

export { ServiceRequestStatus };

export class UpdateServiceRequestStatusDto {
  @ApiProperty({
    enum: ServiceRequestStatus,
    example: ServiceRequestStatus.EN_PROCESO,
  })
  @IsEnum(ServiceRequestStatus)
  status: ServiceRequestStatus;
}
