import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type {
  SittingTimes,
  UpdateSittingTimesDto,
  AddLateArrivalDto,
} from './dining.types';
import { DiningService } from './dining.service';
import { CreateDiningRequestDto } from './dto/create-dining-request.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('api/v1/dining')
export class DiningController {
  constructor(private diningService: DiningService) {}

  // Guest + EM — recommended sitting times per meal (read).
  // Declared before the :param routes so "sitting-times" isn't swallowed.
  @Get('sitting-times')
  getSittingTimes() {
    return this.diningService.getSittingTimes();
  }

  // EM — everything awaiting confirmation, across every booking.
  // Also declared before the :param routes.
  @Get('queue')
  @Roles('estate_manager', 'owner')
  getQueue() {
    return this.diningService.getQueue();
  }

  // EM/owner — configure the recommended sitting times.
  @Patch('sitting-times')
  @Roles('estate_manager', 'owner')
  updateSittingTimes(@Body() dto: UpdateSittingTimesDto) {
    return this.diningService.updateSittingTimes(dto as SittingTimes);
  }

  // Guest + EM — list dining requests for a booking
  @Get('bookings/:bookingId')
  findByBooking(@Param('bookingId') bookingId: string) {
    return this.diningService.findByBooking(bookingId);
  }

  // Guest — create a sitting reservation or a snack/drink order
  @Post('bookings/:bookingId')
  create(
    @Param('bookingId') bookingId: string,
    @Body() dto: CreateDiningRequestDto,
    @CurrentUser() user: any,
  ) {
    return this.diningService.create(bookingId, dto, {
      email: user.email,
      name: user.firstName || user.email,
      tier: user.guestTier,
    });
  }

  // Secondary guest — flag a late arrival to a sitting.
  @Post(':id/late-arrival')
  @HttpCode(HttpStatus.OK)
  addLateArrival(
    @Param('id') id: string,
    @Body() dto: AddLateArrivalDto,
    @CurrentUser() user: any,
  ) {
    return this.diningService.addLateArrival(
      id,
      { email: user.email, name: user.firstName || user.email },
      dto,
      new Date().toISOString(),
    );
  }

  // EM — confirm a dining request
  @Patch(':id/confirm')
  @HttpCode(HttpStatus.OK)
  @Roles('estate_manager')
  confirm(@Param('id') id: string) {
    return this.diningService.confirm(id);
  }

  // Guest or EM — cancel a dining request. The actor is passed through so a
  // guest cancelling their own isn't notified about their own action.
  @Patch(':id/cancel')
  @HttpCode(HttpStatus.OK)
  cancel(@Param('id') id: string, @CurrentUser() user: { email?: string }) {
    return this.diningService.cancel(id, user?.email);
  }
}
