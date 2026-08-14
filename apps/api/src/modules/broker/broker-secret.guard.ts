import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

/**
 * Guards the broker endpoints with a shared secret.
 *
 * The estate wanted one link for every broker rather than an account each, so
 * there is no user to authenticate. What this actually protects is the API
 * itself: the secret is held by the teaser site's server, which proxies the
 * broker page's requests, so the secret never reaches a browser and the
 * endpoints aren't open to the world.
 *
 * It is not a substitute for per-broker identity. If the estate later wants to
 * revoke one broker without disturbing the rest, that needs real tokens — this
 * guard is the thing you'd replace.
 */
@Injectable()
export class BrokerSecretGuard implements CanActivate {
  private readonly logger = new Logger(BrokerSecretGuard.name);

  constructor(private config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const expected = this.config.get<string>('BROKER_API_SECRET');

    // An unset secret must REFUSE, never wave requests through. Getting this
    // backwards would leave the endpoints wide open on any environment where
    // someone forgot the variable.
    if (!expected) {
      this.logger.error('BROKER_API_SECRET is not set — refusing broker request');
      throw new UnauthorizedException('Broker access is not configured');
    }

    const request = context.switchToHttp().getRequest();
    const header = request.headers?.['x-broker-secret'];
    const provided = Array.isArray(header) ? header[0] : header;

    if (typeof provided !== 'string' || !this.matches(provided, expected)) {
      throw new UnauthorizedException('Invalid broker credentials');
    }

    return true;
  }

  /** Length-independent constant-time compare. */
  private matches(a: string, b: string): boolean {
    const ha = crypto.createHash('sha256').update(a).digest();
    const hb = crypto.createHash('sha256').update(b).digest();
    return crypto.timingSafeEqual(ha, hb);
  }
}
