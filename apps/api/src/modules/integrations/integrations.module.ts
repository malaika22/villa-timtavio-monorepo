import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { BreezeWayModule } from '../breezeway/breezeway.module';
import { RequestsModule } from '../requests/requests.module';
import { PusherModule } from '../pusher/pusher.module';
import { IntegrationsScheduler } from './integrations.scheduler';
import { SortlyService } from './sortly.service';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'lodgify-sync' }),
    BreezeWayModule,
    RequestsModule,
    PusherModule,
  ],
  providers: [IntegrationsScheduler, SortlyService],
  exports: [SortlyService],
})
export class IntegrationsModule {}
