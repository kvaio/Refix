import { Module } from '@nestjs/common';
import { RolesGuard } from '../auth/guards/roles/roles.guard';
import { ServiceRequestsController } from './service-requests.controller';
import { ServiceRequestsService } from './service-requests.service';

@Module({
  controllers: [ServiceRequestsController],
  providers: [
    ServiceRequestsService,
    RolesGuard,
  ],
  exports: [ServiceRequestsService],
})
export class ServiceRequestsModule {}