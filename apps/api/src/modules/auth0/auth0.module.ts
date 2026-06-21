// apps/api/src/auth0/auth0.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { Auth0ManagementService } from './auth0-management.service';
import { MagicLinkService } from './magic-link.service';
import { MagicLinkProcessor } from './magic-link.processor';
import { MagicLinkController } from './magic-link.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule, BullModule.registerQueue({ name: 'magic-links' })],
  controllers: [MagicLinkController],
  providers: [Auth0ManagementService, MagicLinkService, MagicLinkProcessor],
  exports: [MagicLinkService, Auth0ManagementService],
})
export class Auth0Module {}
