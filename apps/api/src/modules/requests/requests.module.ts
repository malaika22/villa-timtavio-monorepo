import { Module } from '@nestjs/common';
import { RequestsService } from './requests.service';
import { ConflictService } from './conflict.service';
import { RequestsController } from './requests.controller';
import { BreezeWayModule } from '../breezeway/breezeway.module';
import { PusherModule } from '../pusher/pusher.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [BreezeWayModule, PusherModule, NotificationsModule],
  controllers: [RequestsController],
  providers: [RequestsService, ConflictService],
  exports: [RequestsService],
})
export class RequestsModule {}
