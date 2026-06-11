import { Controller, Get, Query } from '@nestjs/common';
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

  @Get('system-alerts')
  @Roles('estate_manager', 'owner')
  getSystemAlerts(
    @Query('category') category?: string,
    @Query('isDismissed') isDismissed?: string,
  ) {
    const dismissed =
      isDismissed === undefined ? false : isDismissed === 'true';
    return this.systemService.getSystemAlerts(category, dismissed);
  }
}
