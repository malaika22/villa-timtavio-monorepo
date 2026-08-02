import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwksClient } from 'jwks-rsa';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
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
      secretOrKeyProvider: async (request: any, rawToken: string, done: any) => {
        try {
          const decoded = jwt.decode(rawToken, { complete: true }) as any;
          if (!decoded) return done(new Error('Invalid token'));

          if (decoded.header.alg === 'HS256') {
            return done(null, config.get('JWT_SECRET'));
          }

          // RS256 — fetch key from Auth0 JWKS
          const jwks = new JwksClient({
            cache: true,
            rateLimit: true,
            jwksRequestsPerMinute: 5,
            jwksUri: `https://${config.get('AUTH0_DOMAIN')}/.well-known/jwks.json`,
          });
          const key = await jwks.getSigningKey(decoded.header.kid);
          return done(null, key.getPublicKey());
        } catch (err) {
          return done(err);
        }
      },
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      audience: config.get('AUTH0_AUDIENCE'),
      algorithms: ['RS256', 'HS256'],
    });
  }

  async validate(payload: JwtPayload): Promise<AuthUser> {
    const isAuth0Token = payload.iss === `https://${this.config.get('AUTH0_DOMAIN')}/`;
    const isOurToken = payload.iss === 'villa-timtavio';

    if (!isAuth0Token && !isOurToken) {
      throw new UnauthorizedException('Invalid token issuer');
    }

    const roles: string[] =
      (payload[`${AUTH0_NAMESPACE}/roles`] as string[]) || [];
    const bookingId: string | null =
      (payload[`${AUTH0_NAMESPACE}/bookingId`] as string | null) || null;
    const guestTier: 'primary' | 'secondary' | null =
      (payload[`${AUTH0_NAMESPACE}/guestTier`] as 'primary' | 'secondary' | null) || null;

    if (!roles.length) {
      throw new UnauthorizedException('No roles assigned to this user');
    }

    const isGuestRole =
      roles.includes('primary_member') || roles.includes('secondary_guest');

    if (isGuestRole && bookingId) {
      const booking = await this.prisma.booking.findUnique({
        where: { id: bookingId },
        select: { status: true, checkOut: true },
      });

      if (!booking) throw new UnauthorizedException('Booking not found');
      if (booking.status === 'CANCELLED')
        throw new UnauthorizedException('Booking has been cancelled');

      if (booking.status === 'CHECKED_OUT') {
        const expiresAt = new Date(booking.checkOut.getTime() + 24 * 60 * 60 * 1000);
        if (new Date() > expiresAt)
          throw new UnauthorizedException('Your stay access has expired');
      }

      // A secondary must still be on the manifest. Sessions now last the life
      // of the booking, so without this a guest removed from the party in
      // August would keep access right through to September — deleting their
      // pending link does nothing to a token already issued.
      if (guestTier === 'secondary' && payload.email) {
        const stillOnManifest = await this.prisma.manifestGuest.findFirst({
          where: {
            bookingId,
            email: { equals: payload.email, mode: 'insensitive' },
          },
          select: { id: true },
        });
        if (!stillOnManifest) {
          throw new UnauthorizedException(
            'You are no longer listed on this reservation',
          );
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
