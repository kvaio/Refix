import { Module } from '@nestjs/common';

import { TechniciansController } from './technicians.controller';
import { TechniciansService } from './technicians.service';
import { RolesGuard } from '../auth/guards/roles/roles.guard';

@Module({
  controllers: [TechniciansController],
  providers: [TechniciansService, RolesGuard],
  exports: [TechniciansService],
})
export class TechniciansModule {}
