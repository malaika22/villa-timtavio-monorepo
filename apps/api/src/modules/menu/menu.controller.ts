import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Put,
  Query,
} from '@nestjs/common';
import type { AuthUser } from '../auth/jwt.strategy';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { MenuRulesService } from './menu-rules.service';
import { MenuSelectionService } from './menu-selection.service';
import { UpsertMenuSelectionDto } from './dto/upsert-menu-selection.dto';
import type { DiningRules } from './menu.types';

const isEstate = (user: AuthUser) =>
  !!user?.roles?.some((r) => r === 'estate_manager' || r === 'owner');

@Controller('api/v1/menu')
export class MenuController {
  constructor(
    private rules: MenuRulesService,
    private selections: MenuSelectionService,
  ) {}

  // Guest + EM — service windows, allowances and the cutoff. The guest app
  // needs all three to draw a composer that can't ask for the impossible.
  @Get('rules')
  getRules() {
    return this.rules.get();
  }

  @Patch('rules')
  @Roles('estate_manager', 'owner')
  updateRules(@Body() dto: Partial<DiningRules>) {
    return this.rules.update(dto);
  }

  // EM — every meal the estate is cooking over a stretch of days.
  @Get('kitchen')
  @Roles('estate_manager', 'owner')
  getKitchenSheet(@Query('from') from: string, @Query('to') to: string) {
    return this.selections.getKitchenSheet(from, to);
  }

  // Guest + EM — the stay day by day, with what's chosen and what's still open.
  @Get('bookings/:bookingId/plan')
  getPlan(@Param('bookingId') bookingId: string) {
    return this.selections.getPlan(bookingId);
  }

  /**
   * Compose one meal.
   *
   * Only the primary member composes: the estate cooks one menu for the party,
   * so a second guest overwriting the first's dinner isn't a permission problem
   * to solve so much as a conversation to have over breakfast. Secondaries can
   * still flag a late arrival on the sitting.
   */
  @Put('bookings/:bookingId/selections')
  upsert(
    @Param('bookingId') bookingId: string,
    @Body() dto: UpsertMenuSelectionDto,
    @CurrentUser() user: AuthUser,
  ) {
    const estate = isEstate(user);
    if (!estate && user?.guestTier === 'secondary') {
      throw new ForbiddenException(
        'Only the primary member composes the menu. Ask them, or speak to your concierge.',
      );
    }

    return this.selections.upsert(bookingId, dto, {
      email: user?.email ?? 'unknown',
      name: user?.firstName || user?.email || 'The party',
      isEstate: estate,
    });
  }
}
