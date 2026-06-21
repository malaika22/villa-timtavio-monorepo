import {
  Body,
  Controller,
  Logger,
  Post,
  UnauthorizedException,
} from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import {
  PUSHER_CHANNELS,
  PusherService,
} from './pusher.service';

@Controller('api/v1/pusher')
export class PusherController {
  private readonly logger = new Logger(PusherController.name);

  constructor(private pusherService: PusherService) {}

  @Post('auth')
  authGuestChannel(
    @Body() body: { socket_id: string; channel_name: string },
    @CurrentUser() user: { bookingId?: string },
  ) {
    const { socket_id, channel_name } = body;

    if (!socket_id || !channel_name) {
      throw new UnauthorizedException(
        'socket_id and channel_name are required',
      );
    }

    if (!user.bookingId) {
      throw new UnauthorizedException(
        'No booking associated with this session',
      );
    }

    const expectedChannel = PUSHER_CHANNELS.guestBooking(user.bookingId);

    if (channel_name !== expectedChannel) {
      this.logger.warn(
        `Guest tried to subscribe to wrong channel: ${channel_name} (expected ${expectedChannel})`,
      );
      throw new UnauthorizedException('You cannot subscribe to this channel');
    }

    return this.pusherService.authenticateGuestChannel(
      socket_id,
      channel_name,
      user.bookingId,
    );
  }

  @Post('auth-em')
  @Roles('estate_manager', 'owner')
  authEmChannel(
    @Body() body: { socket_id: string; channel_name: string },
    @CurrentUser() user: { auth0Id: string; roles?: string[] },
  ) {
    const { socket_id, channel_name } = body;

    if (!socket_id || !channel_name) {
      throw new UnauthorizedException(
        'socket_id and channel_name are required',
      );
    }

    const allowedChannels = [
      PUSHER_CHANNELS.emDashboard,
      PUSHER_CHANNELS.ownerDashboard,
    ];

    if (!allowedChannels.includes(channel_name)) {
      this.logger.warn(
        `Dashboard user tried to subscribe to disallowed channel: ${channel_name}`,
      );
      throw new UnauthorizedException('You cannot subscribe to this channel');
    }

    if (
      channel_name === PUSHER_CHANNELS.emDashboard &&
      user.roles?.includes('owner') &&
      !user.roles?.includes('estate_manager')
    ) {
      throw new UnauthorizedException(
        'Owners cannot subscribe to the Estate Manager channel',
      );
    }

    return this.pusherService.authenticateEmChannel(socket_id, channel_name);
  }
}
