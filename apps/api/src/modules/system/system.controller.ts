import { Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { SystemService } from './system.service';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('api/v1')
export class SystemController {
  constructor(private systemService: SystemService) {}

  @Get('system/lodgify-sync-status')
  @Roles('estate_manager', 'owner')
  getLodgifySyncStatus() {
    return this.systemService.getLodgifySyncStatus();
  }

  @Get('system/health')
  @Roles('owner', 'estate_manager')
  getHealth() {
    return this.systemService.getHealth();
  }

  @Get('system/active-sessions')
  @Roles('owner', 'estate_manager')
  getActiveSessions() {
    return this.systemService.getActiveSessions();
  }

  @Get('system-alerts')
  @Roles('estate_manager', 'owner')
  getSystemAlerts(
    @Query('category') category?: string,
    @Query('isDismissed') isDismissed?: string,
  ) {
    const dismissed =
      isDismissed === undefined
        ? false
        : isDismissed === 'all'
          ? undefined
          : isDismissed === 'true';
    return this.systemService.getSystemAlerts(category, dismissed);
  }

  @Post('system-alerts/read-all')
  @Roles('estate_manager', 'owner')
  markAllAlertsRead() {
    return this.systemService.markAllAlertsRead();
  }

  @Patch('system-alerts/:id/dismiss')
  @Roles('estate_manager', 'owner')
  dismissSystemAlert(@Param('id') id: string) {
    return this.systemService.dismissAlert(id);
  }
}
