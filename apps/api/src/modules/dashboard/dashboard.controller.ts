// apps/api/src/dashboard/dashboard.controller.ts
import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { DashboardService } from './dashboard.service';

@Controller('api/v1/dashboard')
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  // KPI cards
  @Get('kpis')
  @Roles('estate_manager', 'owner')
  getKpis() {
    return this.dashboardService.getKpis();
  }

  // Alert banner
  @Get('alert-banner')
  @Roles('estate_manager', 'owner')
  getAlertBanner() {
    return this.dashboardService.getAlertBanner();
  }

  // Week calendar (occupancy, arrivals, departures, experiences)
  @Get('calendar')
  @Roles('estate_manager', 'owner')
  getCalendar(@Query('start') start?: string) {
    return this.dashboardService.getCalendar(start);
  }

  // Today's schedule (merged experiences + manual items)
  @Get('schedule/today')
  @Roles('estate_manager', 'owner')
  getTodaySchedule() {
    return this.dashboardService.getTodaySchedule();
  }

  // Add manual schedule item (transport, security briefing etc)
  @Post('schedule')
  @Roles('estate_manager', 'owner')
  addScheduleItem(
    @Body()
    body: {
      title: string;
      time: string;
      location?: string;
      guestName?: string;
      bookingId?: string;
      type: string;
      notes?: string;
    },
  ) {
    return this.dashboardService.addScheduleItem(body);
  }

  // Export overview as CSV
  @Get('export')
  @Roles('estate_manager', 'owner')
  exportOverview() {
    return this.dashboardService.exportOverview();
  }
}
