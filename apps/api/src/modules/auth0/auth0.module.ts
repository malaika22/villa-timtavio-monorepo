import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Auth0ManagementService } from './auth0-management.service';
import { MagicLinkService } from './magic-link.service';
import { MagicLinkProcessor } from './magic-link.processor';
import { MagicLinkController } from './magic-link.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    BullModule.registerQueue({ name: 'magic-links' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET'),
        signOptions: { algorithm: 'HS256' },
      }),
    }),
  ],
  controllers: [MagicLinkController],
  providers: [Auth0ManagementService, MagicLinkService, MagicLinkProcessor],
  exports: [MagicLinkService, Auth0ManagementService],
})
export class Auth0Module {}
