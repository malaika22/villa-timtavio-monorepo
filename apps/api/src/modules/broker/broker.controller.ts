import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import type { AuthUser } from '../auth/jwt.strategy';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { BrokerSecretGuard } from './broker-secret.guard';
import { BrokerService } from './broker.service';
import { BrokerNotifyService } from './broker-notify.service';
import { CreateBrokerHoldDto } from './dto/create-broker-hold.dto';

/**
 * Two audiences on one controller.
 *
 * The `public/*` routes are reached only by the teaser site's server, which
 * holds the shared secret — never by a browser. Everything else is the estate
 * manager resolving what those routes created.
 */
@Controller('api/v1/broker')
export class BrokerController {
  constructor(
    private broker: BrokerService,
    private notify: BrokerNotifyService,
  ) {}

  // ─── Broker page (shared secret, no user) ─────────────────────────────────

  @Get('public/availability')
  @Public()
  @UseGuards(BrokerSecretGuard)
  availability(@Query('from') from?: string, @Query('to') to?: string) {
    return this.broker.availability(from, to);
  }

  @Post('public/holds')
  @Public()
  @UseGuards(BrokerSecretGuard)
  async createHold(@Body() dto: CreateBrokerHoldDto) {
    const hold = await this.broker.createHold(dto);

    // Deliberately not awaited into the response: the broker has their answer
    // the moment the row exists, and a slow mail server must not make the page
    // look like the hold failed.
    void this.notify.holdPlaced(hold);

    return {
      id: hold.id,
      checkIn: hold.checkIn,
      checkOut: hold.checkOut,
      nights: hold.nights,
      expiresAt: hold.expiresAt,
      estimatedTotal: hold.estimatedTotal,
    };
  }

  // ─── Estate manager ───────────────────────────────────────────────────────

  @Get('holds')
  @Roles('estate_manager', 'owner')
  listHolds() {
    return this.broker.listHolds();
  }

  @Post('holds/:id/confirm')
  @Roles('estate_manager')
  confirm(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.broker.confirmHold(id, user?.email ?? 'estate_manager');
  }

  @Delete('holds/:id')
  @Roles('estate_manager')
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.broker.deleteHold(id, user?.email ?? 'estate_manager');
  }

  @Post('holds/:id/release')
  @Roles('estate_manager')
  async release(
    @Param('id') id: string,
    @Body() body: { note?: string },
    @CurrentUser() user: AuthUser,
  ) {
    const hold = await this.broker.releaseHold(
      id,
      user?.email ?? 'estate_manager',
      body?.note,
    );

    // Sent for a pending release as much as a confirmed one: either way the
    // broker asked for dates and isn't getting them, and finding out by
    // reloading the availability page is worse than being told.
    //
    // Not awaited, for the same reason `createHold` doesn't await its own —
    // the nights are already open, and a slow mail server must not make the
    // release look like it failed.
    void this.notify.holdReleased(hold);

    return hold;
  }
}
