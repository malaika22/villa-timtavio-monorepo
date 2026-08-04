import { Module } from '@nestjs/common';
import { DailyMenuService } from './daily-menu.service';
import { DailyMenuController } from './daily-menu.controller';

@Module({
  controllers: [DailyMenuController],
  providers: [DailyMenuService],
  exports: [DailyMenuService],
})
export class DailyMenuModule {}
