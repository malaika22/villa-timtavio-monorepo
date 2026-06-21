import { Module, forwardRef } from '@nestjs/common';
import { ManifestController } from './manifest.controller';
import { ManifestService } from './manifest.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { Auth0Module } from '../auth0/auth0.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PusherModule } from '../pusher/pusher.module';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => Auth0Module),
    NotificationsModule,
    PusherModule,
  ],
  controllers: [ManifestController],
  providers: [ManifestService],
  exports: [ManifestService],
})
export class ManifestModule {}
