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
import type { AddLateArrivalDto } from './dining.types';
import { DiningService } from './dining.service';
import { CreateDiningRequestDto } from './dto/create-dining-request.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('api/v1/dining')
export class DiningController {
  constructor(private diningService: DiningService) {}

  // EM — orders awaiting acknowledgement, across every booking. Declared
  // before the :param routes so "queue" isn't swallowed by them.
  @Get('queue')
  @Roles('estate_manager', 'owner')
  getQueue() {
    return this.diningService.getQueue();
  }

  // Guest + EM — list dining requests for a booking
  // Guest (primary) — additions still waiting on their decision.
  @Get('bookings/:bookingId/approvals')
  getPendingApprovals(@Param('bookingId') bookingId: string) {
    return this.diningService.getPendingApprovals(bookingId);
  }

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
  // Guest (primary) — decide on a secondary's chargeable addition. Separate
  // from the estate's confirmation: two people, two different questions.
  @Patch(':id/approve')
  @HttpCode(HttpStatus.OK)
  approveExclusive(
    @Param('id') id: string,
    @CurrentUser() user: { email?: string },
  ) {
    return this.diningService.approveExclusive(id, user?.email ?? 'primary');
  }

  @Patch(':id/decline')
  @HttpCode(HttpStatus.OK)
  declineExclusive(
    @Param('id') id: string,
    @Body() body: { reason?: string },
    @CurrentUser() user: { email?: string },
  ) {
    return this.diningService.declineExclusive(
      id,
      user?.email ?? 'primary',
      body?.reason,
    );
  }

  @Patch(':id/confirm')
  @HttpCode(HttpStatus.OK)
  @Roles('estate_manager')
  confirm(@Param('id') id: string, @CurrentUser() user: { email?: string }) {
    return this.diningService.confirm(id, user?.email ?? 'estate_manager');
  }

  // Guest or EM — cancel a dining request. The actor is passed through so a
  // guest cancelling their own isn't notified about their own action.
  @Patch(':id/cancel')
  @HttpCode(HttpStatus.OK)
  cancel(@Param('id') id: string, @CurrentUser() user: { email?: string }) {
    return this.diningService.cancel(id, user?.email);
  }
}
