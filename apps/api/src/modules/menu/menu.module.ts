import { Module } from '@nestjs/common';
import { PusherModule } from '../pusher/pusher.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { MenuController } from './menu.controller';
import { MenuRulesService } from './menu-rules.service';
import { MenuSelectionService } from './menu-selection.service';

@Module({
  imports: [PusherModule, NotificationsModule],
  controllers: [MenuController],
  providers: [MenuRulesService, MenuSelectionService],
  // Dining reads the rules to bound a sitting time by the estate's window.
  exports: [MenuRulesService],
})
export class MenuModule {}
