// apps/api/src/auth/jwt.strategy.ts
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';
import { ConfigService } from '@nestjs/config';
import { AUTH0_NAMESPACE } from './constants';
import { PrismaService } from '../../prisma/prisma.service';

export interface JwtPayload {
  sub: string;
  email: string;
  [key: `${typeof AUTH0_NAMESPACE}/${string}`]: string[] | string | undefined;
  iat: number;
  exp: number;
  aud: string;
  iss: string;
  given_name: string;
}

export interface AuthUser {
  auth0Id: string;
  email: string;
  firstName: string;
  roles: string[];
  bookingId: string | null;
  guestTier: 'primary' | 'secondary' | null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `https://${config.get('AUTH0_DOMAIN')}/.well-known/jwks.json`,
      }),
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      audience: config.get('AUTH0_AUDIENCE'),
      issuer: `https://${config.get('AUTH0_DOMAIN')}/`,
      algorithms: ['RS256'],
    });
  }

  async validate(payload: JwtPayload): Promise<AuthUser> {
    const roles: string[] =
      (payload[`${AUTH0_NAMESPACE}/roles`] as string[]) || [];
    const bookingId: string | null =
      (payload[`${AUTH0_NAMESPACE}/bookingId`] as string | null) || null;
    const guestTier: 'primary' | 'secondary' | null =
      (payload[`${AUTH0_NAMESPACE}/guestTier`] as
        | 'primary'
        | 'secondary'
        | null) || null;

    if (!roles.length) {
      throw new UnauthorizedException('No roles assigned to this user');
    }

    // For guest roles — validate the booking is still active
    const isGuestRole =
      roles.includes('primary_member') || roles.includes('secondary_guest');

    if (isGuestRole && bookingId) {
      const booking = await this.prisma.booking.findUnique({
        where: { id: bookingId },
        select: { status: true, checkOut: true },
      });

      if (!booking) {
        throw new UnauthorizedException('Booking not found');
      }

      if (booking.status === 'CANCELLED') {
        throw new UnauthorizedException('Booking has been cancelled');
      }

      // Check 24h post-checkout expiry
      if (booking.status === 'CHECKED_OUT') {
        const expiresAt = new Date(
          booking.checkOut.getTime() + 24 * 60 * 60 * 1000,
        );
        if (new Date() > expiresAt) {
          throw new UnauthorizedException('Your stay access has expired');
        }
      }
    }

    return {
      auth0Id: payload.sub,
      email: payload.email,
      firstName: payload.given_name || '',
      roles,
      bookingId,
      guestTier,
    };
  }
}
