// apps/api/src/auth/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';
import { ConfigService } from '@nestjs/config';
import { AUTH0_NAMESPACE } from './constants';

export interface JwtPayload {
  sub: string;
  email: string;
  [key: `${typeof AUTH0_NAMESPACE}/${string}`]: string[] | string | undefined;
  iat: number;
  exp: number;
  aud: string;
  iss: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private config: ConfigService) {
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

  validate(payload: JwtPayload) {
    const roles = payload[`${AUTH0_NAMESPACE}/roles`] || [];
    const bookingId = payload[`${AUTH0_NAMESPACE}/bookingId`];
    const guestTier = payload[`${AUTH0_NAMESPACE}/guestTier`];

    if (!roles.length) {
      throw new UnauthorizedException('No roles assigned to this user');
    }

    return {
      auth0Id: payload.sub,
      email: payload.email,
      roles,
      bookingId,
      guestTier,
    };
  }
}
