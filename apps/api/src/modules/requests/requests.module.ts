import { Module } from '@nestjs/common';
import { RequestsService } from './requests.service';
import { ConflictService } from './conflict.service';
import { VendorBookingService } from './vendor-booking.service';
import { RequestsController } from './requests.controller';
import { RequestsScheduler } from './requests.scheduler';
import { BreezeWayModule } from '../breezeway/breezeway.module';
import { PusherModule } from '../pusher/pusher.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [BreezeWayModule, PusherModule, NotificationsModule],
  controllers: [RequestsController],
  providers: [
    RequestsService,
    ConflictService,
    VendorBookingService,
    RequestsScheduler,
  ],
  exports: [RequestsService],
})
export class RequestsModule {}
