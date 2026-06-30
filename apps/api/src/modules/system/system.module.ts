import { Module } from '@nestjs/common';
import { SystemController } from './system.controller';
import { SystemService } from './system.service';
import { HealthScheduler } from './health.scheduler';

@Module({
  controllers: [SystemController],
  providers: [SystemService, HealthScheduler],
  exports: [SystemService],
})
export class SystemModule {}
