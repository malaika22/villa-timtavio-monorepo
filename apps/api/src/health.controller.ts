import { Controller, Get } from '@nestjs/common';
import { Public } from './modules/auth/decorators/public.decorator';

// Public liveness probe for the platform health check. No auth, no DB touch —
// it only confirms the process is up and serving HTTP.
@Controller()
export class HealthController {
  @Public()
  @Get('healthz')
  healthz() {
    return { status: 'ok' };
  }
}
