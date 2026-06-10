import { Module } from '@nestjs/common';
import { FolioService } from './folio.service';
import { FolioController } from './folio.controller';
import { PusherModule } from '../pusher/pusher.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PusherModule, NotificationsModule],
  controllers: [FolioController],
  providers: [FolioService],
  exports: [FolioService],
})
export class FolioModule {}
