// // apps/api/src/pusher/pusher.controller.ts
// import { Controller, Post, Body } from '@nestjs/common';
// import { PusherService } from './pusher.service';
// import { CurrentUser } from '../auth/current-user.decorator';

// @Controller('api/v1/pusher')
// export class PusherController {
//   constructor(private pusherService: PusherService) {}

//   // Authenticates private Pusher channels for guests
//   @Post('auth')
//   auth(
//     @Body() body: { socket_id: string; channel_name: string },
//     @CurrentUser() user: any,
//   ) {
//     // Validate guest can only subscribe to their own booking channel
//     const bookingId = user.bookingId;
//     const expectedChannel = `private-booking-${bookingId}`;

//     if (body.channel_name !== expectedChannel) {
//       return { error: 'Unauthorized channel' };
//     }

//     return this.pusherService.authenticateChannel(
//       body.socket_id,
//       body.channel_name,
//     );
//   }
// }
