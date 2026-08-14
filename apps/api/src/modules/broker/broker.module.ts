import { Module } from '@nestjs/common';
import { LodgifyModule } from '../lodgify/lodgify.module';
import { BrokerController } from './broker.controller';
import { BrokerService } from './broker.service';
import { BrokerNotifyService } from './broker-notify.service';
import { BrokerScheduler } from './broker.scheduler';

@Module({
  imports: [LodgifyModule],
  controllers: [BrokerController],
  providers: [BrokerService, BrokerNotifyService, BrokerScheduler],
})
export class BrokerModule {}
