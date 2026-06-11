import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Pusher from 'pusher';

@Injectable()
export class PusherService {
  private pusher: Pusher;

  constructor(private config: ConfigService) {
    this.pusher = new Pusher({
      appId: config.getOrThrow<string>('PUSHER_APP_ID'),
      key: config.getOrThrow<string>('PUSHER_KEY'),
      secret: config.getOrThrow<string>('PUSHER_SECRET'),
      cluster: config.getOrThrow<string>('PUSHER_CLUSTER'),
      useTLS: true,
    });
  }

  async trigger(channel: string, event: string, data: any) {
    return this.pusher.trigger(channel, event, data);
  }

  authenticateChannel(socketId: string, channel: string) {
    return this.pusher.authorizeChannel(socketId, channel, {
      user_id: socketId,
    });
  }

  async triggerEmDashboard(event: string, data: Record<string, unknown>) {
    return this.trigger('private-em-dashboard', event, data);
  }
}
