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

  @Get('revenue')
  @Roles('owner')
  getRevenueSummary() {
    return this.analyticsService.getRevenueSummary();
  }

  @Get('satisfaction')
  @Roles('owner')
  getSatisfaction() {
    return this.analyticsService.getSatisfaction();
  }

  @Get('equipment')
  @Roles('owner')
  getEquipmentAnalysis() {
    return this.analyticsService.getEquipmentAnalysis();
  }

  @Get('unmet-demand')
  @Roles('owner')
  getUnmetDemand() {
    return this.analyticsService.getUnmetDemand();
  }

  @Get('occupancy-calendar')
  @Roles('owner')
  getOccupancyCalendar() {
    return this.analyticsService.getOccupancyCalendar();
  }

  @Get('occupancy-monthly')
  @Roles('owner')
  getOccupancyMonthly() {
    return this.analyticsService.getOccupancyMonthly();
  }

  @Get('experience-seasonality')
  @Roles('owner')
  getExperienceSeasonality() {
    return this.analyticsService.getExperienceSeasonality();
  }

  @Get('heat-map/insights')
  @Roles('owner')
  getHeatMapInsights() {
    return this.analyticsService.getHeatMapInsights();
  }

  @Get('experience-insights')
  @Roles('owner')
  getExperienceInsights() {
    return this.analyticsService.getExperienceInsights();
  }

  @Get('vendor-forecast')
  @Roles('owner')
  getVendorForecast() {
    return this.analyticsService.getVendorForecast();
  }

  @Get('heat-map/cell')
  @Roles('owner')
  getHeatMapCell(
    @Query('space') space: string,
    @Query('timeBlock') timeBlock: string,
    @Query('date') date?: string,
  ) {
    return this.analyticsService.getHeatMapCell(space, timeBlock, date);
  }

  @Get('vendors')
  @Roles('owner')
  getVendorPerformance() {
    return this.analyticsService.getVendorPerformance();
  }

  @Get('revenue-mix')
  @Roles('owner')
  getRevenueMix() {
    return this.analyticsService.getRevenueMix();
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
