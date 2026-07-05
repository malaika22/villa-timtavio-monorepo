import { Controller, Get } from '@nestjs/common';

// Public liveness probe for the platform health check. No auth, no DB touch —
// it only confirms the process is up and serving HTTP.
@Controller()
export class HealthController {
  @Get('healthz')
  healthz() {
    return { status: 'ok' };
  }
}
