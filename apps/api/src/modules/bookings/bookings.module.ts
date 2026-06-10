import { Module, forwardRef } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { BookingsScheduler } from './bookings.scheduler';
import { Auth0Module } from '../auth0/auth0.module';
import { InquiriesModule } from '../inqueries/inquiries.module';

@Module({
  imports: [forwardRef(() => Auth0Module), InquiriesModule],
  controllers: [BookingsController],
  providers: [BookingsService, BookingsScheduler],
  exports: [BookingsService],
})
export class BookingsModule {}
