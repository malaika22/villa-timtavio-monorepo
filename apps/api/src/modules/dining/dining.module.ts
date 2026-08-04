import { Module } from '@nestjs/common';
import { DiningService } from './dining.service';
import { DiningController } from './dining.controller';
import { PusherModule } from '../pusher/pusher.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PusherModule, NotificationsModule],
  controllers: [DiningController],
  providers: [DiningService],
  exports: [DiningService],
})
export class DiningModule {}
