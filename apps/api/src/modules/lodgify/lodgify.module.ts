import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { LodgifyService } from './lodgify.service';
import { LodgifyProcessor } from './lodgify.processor';
import { BookingsModule } from '../bookings/bookings.module';

@Module({
  imports: [BullModule.registerQueue({ name: 'lodgify-sync' }), BookingsModule],
  providers: [LodgifyService, LodgifyProcessor],
  exports: [LodgifyService],
})
export class LodgifyModule {}
