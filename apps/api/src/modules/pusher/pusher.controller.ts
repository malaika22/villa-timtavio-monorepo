import {
  Body,
  Controller,
  ForbiddenException,
  Post,
} from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { PusherService } from './pusher.service';

@Controller('api/v1/pusher')
export class PusherController {
  constructor(private pusherService: PusherService) {}

  @Post('auth-em')
  @Roles('estate_manager', 'owner')
  authEm(
    @Body() body: { socket_id: string; channel_name: string },
    @CurrentUser() _user: { auth0Id: string },
  ) {
    const allowed =
      body.channel_name === 'private-em-dashboard' ||
      body.channel_name.startsWith('private-em-');

    if (!allowed) {
      throw new ForbiddenException('Unauthorized channel');
    }

    return this.pusherService.authenticateChannel(
      body.socket_id,
      body.channel_name,
    );
  }
}
