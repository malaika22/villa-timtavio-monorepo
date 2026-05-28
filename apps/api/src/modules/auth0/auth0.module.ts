// apps/api/src/auth0/auth0.module.ts
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule } from '@nestjs/config';
import { Auth0ManagementService } from './auth0-management.service';
import { MagicLinkService } from './magic-link.service';
import { MagicLinkProcessor } from './magic-link.processor.ts';
import { PrismaModule } from '../../prisma/prisma.module.ts';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    BullModule.registerQueue({ name: 'magic-links' }),
  ],
  providers: [Auth0ManagementService, MagicLinkService, MagicLinkProcessor],
  exports: [MagicLinkService, Auth0ManagementService],
})
export class Auth0Module {}
