import { Controller, Get, Query } from '@nestjs/common';
import { Roles } from '../modules/auth/decorators/roles.decorator';
import { AnalyticsService } from './analytics.service';

@Controller('api/v1/analytics')
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get('overview')
  @Roles('owner', 'estate_manager')
  getOverview(@Query('period') period?: string) {
    return this.analyticsService.getOverview(period);
  }

  @Get('satisfaction')
  @Roles('owner')
  getSatisfaction() {
    return this.analyticsService.getSatisfaction();
  }

  @Get('revenue-trend')
  @Roles('owner')
  getRevenueTrend(
    @Query('year') year: string,
    @Query('compare') compare?: string,
  ) {
    return this.analyticsService.getRevenueTrend(
      parseInt(year),
      compare ? parseInt(compare) : undefined,
    );
  }

  @Get('occupancy')
  @Roles('owner')
  getOccupancy(@Query('period') period?: string) {
    return this.analyticsService.getOccupancy(period);
  }

  @Get('heat-map')
  @Roles('owner')
  getHeatMap(
    @Query('date') date?: string,
    @Query('range') range?: string,
    @Query('category') category?: string,
  ) {
    return this.analyticsService.getHeatMap({ date, range, category });
  }

  @Get('peak-hours')
  @Roles('owner')
  getPeakHours(@Query('date') date?: string) {
    return this.analyticsService.getPeakHours(date);
  }

  @Get('experiences')
  @Roles('owner')
  getExperiencePerformance(@Query('period') period?: string) {
    return this.analyticsService.getExperiencePerformance(period);
  }

  @Get('upcoming-stays')
  @Roles('owner')
  getUpcomingStays() {
    return this.analyticsService.getUpcomingStays();
  }

  @Get('intelligence-alerts')
  @Roles('owner')
  getIntelligenceAlerts() {
    return this.analyticsService.getIntelligenceAlerts();
  }
}
