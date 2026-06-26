import {
  Controller,
  Get,
  Param,
  Patch,
  Post,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('api/v1/notifications')
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  // Guest — list notifications for a booking (recipient = current user)
  @Get('bookings/:bookingId')
  list(@Param('bookingId') bookingId: string, @CurrentUser() user: any) {
    return this.notificationsService.getForGuest(bookingId, user.email);
  }

  @Get('bookings/:bookingId/unread-count')
  unreadCount(@Param('bookingId') bookingId: string, @CurrentUser() user: any) {
    return this.notificationsService.getUnreadCount(bookingId, user.email);
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  markRead(@Param('id') id: string) {
    return this.notificationsService.markRead(id);
  }

  @Post('bookings/:bookingId/read-all')
  @HttpCode(HttpStatus.OK)
  markAllRead(@Param('bookingId') bookingId: string, @CurrentUser() user: any) {
    return this.notificationsService.markAllRead(bookingId, user.email);
  }
}
