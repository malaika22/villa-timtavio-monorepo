import { Module } from '@nestjs/common';
import { DiningService } from './dining.service';
import { DiningController } from './dining.controller';
import { PusherModule } from '../pusher/pusher.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { MenuModule } from '../menu/menu.module';

@Module({
  // Menu owns the service windows a sitting has to fall inside.
  imports: [PusherModule, NotificationsModule, MenuModule],
  controllers: [DiningController],
  providers: [DiningService],
  exports: [DiningService],
})
export class DiningModule {}
