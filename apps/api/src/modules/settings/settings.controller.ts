import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { StaffRole } from '@prisma/client';
import { SettingsService } from './settings.service';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('api/v1/settings')
export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  @Get()
  @Roles('estate_manager', 'owner')
  getSettings() {
    return this.settingsService.getSettings();
  }

  @Patch()
  @Roles('estate_manager', 'owner')
  updateSettings(@Body() body: Record<string, unknown>) {
    return this.settingsService.updateSettings(body);
  }

  @Get('staff')
  @Roles('estate_manager', 'owner')
  listStaff() {
    return this.settingsService.listStaff();
  }

  // Owner-only: provisioning staff accounts.
  @Post('staff')
  @Roles('owner')
  createStaff(
    @Body() body: { name: string; email: string; role?: StaffRole },
  ) {
    return this.settingsService.createStaff(body);
  }

  @Patch('staff/:id')
  @Roles('owner')
  updateStaff(
    @Param('id') id: string,
    @Body() body: { role?: StaffRole; active?: boolean },
  ) {
    return this.settingsService.updateStaff(id, body);
  }

  @Get('integrations')
  @Roles('estate_manager', 'owner')
  integrations() {
    return this.settingsService.integrationsStatus();
  }
}
