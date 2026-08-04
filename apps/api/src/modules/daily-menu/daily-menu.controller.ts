import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { DailyMenuService } from './daily-menu.service';
import { UpsertDailyMenuDto } from './dto/upsert-daily-menu.dto';
import { CopyDailyMenuDto } from './dto/copy-daily-menu.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('api/v1/daily-menus')
export class DailyMenuController {
  constructor(private dailyMenuService: DailyMenuService) {}

  // Guest — published services only, over the dates they ask about.
  @Get('published')
  getPublished(@Query('from') from: string, @Query('to') to: string) {
    return this.dailyMenuService.getPublishedRange(from, to);
  }

  // EM — the planning grid, drafts included.
  @Get()
  @Roles('estate_manager', 'owner')
  getRange(@Query('from') from: string, @Query('to') to: string) {
    return this.dailyMenuService.getRange(from, to);
  }

  // EM — which of the coming days still have nothing published.
  @Get('gaps')
  @Roles('estate_manager', 'owner')
  getGaps(@Query('withinDays') withinDays?: string) {
    return this.dailyMenuService.getPlanningGaps(
      withinDays ? Number(withinDays) : undefined,
    );
  }

  @Post()
  @Roles('estate_manager')
  upsert(@Body() dto: UpsertDailyMenuDto, @CurrentUser() user: any) {
    return this.dailyMenuService.upsert(dto, user?.email ?? user?.auth0Id);
  }

  @Post('copy')
  @Roles('estate_manager')
  copy(@Body() dto: CopyDailyMenuDto, @CurrentUser() user: any) {
    return this.dailyMenuService.copy(dto, user?.email ?? user?.auth0Id);
  }

  @Patch(':id/publish')
  @Roles('estate_manager')
  publish(@Param('id') id: string, @CurrentUser() user: any) {
    return this.dailyMenuService.publish(id, user?.email ?? user?.auth0Id);
  }

  @Patch(':id/unpublish')
  @Roles('estate_manager')
  unpublish(@Param('id') id: string) {
    return this.dailyMenuService.unpublish(id);
  }

  @Delete(':id')
  @Roles('estate_manager')
  remove(@Param('id') id: string) {
    return this.dailyMenuService.remove(id);
  }
}
