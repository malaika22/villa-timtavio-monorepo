import { Controller, Get, Patch, Post, Param, Body } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { BookingStatus } from '@prisma/client';

@Controller('api/v1/bookings')
export class BookingsController {
  constructor(private bookingsService: BookingsService) {}

  @Get('current')
  getCurrentBooking(@CurrentUser() user: any) {
    return this.bookingsService.getCurrentForGuest(user.bookingId);
  }

  @Get('current-active')
  @Roles('estate_manager', 'owner')
  getCurrentActiveBooking() {
    return this.bookingsService.getCurrentActiveForEm();
  }

  @Patch(':id/status')
  @Roles('estate_manager')
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: BookingStatus,
    @CurrentUser() user: any,
  ) {
    return this.bookingsService.updateStatus(id, status, user.auth0Id);
  }

  @Post(':id/approve-manifest')
  @Roles('estate_manager')
  approveManifest(@Param('id') id: string) {
    return this.bookingsService.approveManifestAndSendSecondaryLinks(id);
  }

  // Place / re-attempt the 50% deposit hold (e.g. for an existing booking).
  @Post(':id/deposit-hold')
  @Roles('estate_manager')
  depositHold(@Param('id') id: string) {
    return this.bookingsService.createDepositHold(id);
  }
}
