// apps/api/src/requests/requests.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { RequestsService } from './requests.service';
import {
  CreateRequestDto,
  ConfirmRequestDto,
  DeclineRequestDto,
} from './dto/create-request.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

/**
 * Strip internal/ops fields from guest-facing request reads, and pricing for
 * secondary guests. Internal callers use the service directly and are
 * unaffected.
 */
function redactForGuest(req: any, tier?: string) {
  if (!req) return req;
  const {
    emNotes: _emNotes,
    breezeWayTaskId: _bwId,
    breezeWayTaskCreatedAt: _bwAt,
    staffMemberName: _staff,
    ...rest
  } = req;
  void _emNotes;
  void _bwId;
  void _bwAt;
  void _staff;
  // Secondary guests never see pricing.
  if (tier === 'secondary' || tier === 'SECONDARY') {
    delete rest.confirmedCost;
  }
  return rest;
}

@Controller('api/v1/requests')
export class RequestsController {
  constructor(private requestsService: RequestsService) {}

  // Guest — submit request
  @Post('bookings/:bookingId')
  create(
    @Param('bookingId') bookingId: string,
    @Body() dto: CreateRequestDto,
    @CurrentUser() user: any,
  ) {
    return this.requestsService.create(bookingId, dto, {
      email: user.email,
      name: user.firstName || user.email,
      tier: user.guestTier || 'secondary',
    });
  }

  // Guest — get requests for booking
  @Get('bookings/:bookingId')
  async findByBooking(
    @Param('bookingId') bookingId: string,
    @CurrentUser() user: any,
    @Query('filter') filter?: 'active' | 'all' | 'today',
  ) {
    const requests = await this.requestsService.findByBooking(bookingId, filter);
    return requests.map((r) => redactForGuest(r, user?.guestTier));
  }

  // Primary member — get upgrade requests awaiting approval
  @Get('bookings/:bookingId/pending-approval')
  @Roles('primary_member')
  getPendingApproval(@Param('bookingId') bookingId: string) {
    return this.requestsService.getPendingPrimaryApproval(bookingId);
  }

  // Primary member — approve a secondary guest upgrade request
  @Post(':id/primary-approve')
  @Roles('primary_member')
  primaryApprove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.requestsService.primaryApprove(id, user.email, user.bookingId);
  }

  // Primary member — decline a secondary guest upgrade request
  @Post(':id/primary-decline')
  @Roles('primary_member')
  primaryDecline(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentUser() user: any,
  ) {
    return this.requestsService.primaryDecline(
      id,
      user.email,
      user.bookingId,
      reason,
    );
  }

  // Guest — get single request
  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    const req = await this.requestsService.findOne(id);
    return redactForGuest(req, user?.guestTier);
  }

  // EM routes
  @Get('em/queue')
  @Roles('estate_manager')
  getQueue() {
    return this.requestsService.getQueue();
  }

  @Get('em/active')
  @Roles('estate_manager')
  getActive() {
    return this.requestsService.getActive();
  }

  @Get('em/today')
  @Roles('estate_manager')
  getTodaySchedule() {
    return this.requestsService.getTodaySchedule();
  }

  @Get('em/history')
  @Roles('estate_manager')
  getHistory() {
    return this.requestsService.getHistory();
  }

  @Patch(':id/approve')
  @Roles('estate_manager')
  approve(
    @Param('id') id: string,
    @Body() dto: ConfirmRequestDto,
    @CurrentUser() user: any,
  ) {
    return this.requestsService.approve(id, dto, user.auth0Id);
  }

  @Patch(':id/decline')
  @Roles('estate_manager')
  decline(
    @Param('id') id: string,
    @Body() dto: DeclineRequestDto,
    @CurrentUser() user: any,
  ) {
    return this.requestsService.decline(id, dto, user.auth0Id);
  }

  @Patch(':id/confirm-cost')
  @Roles('estate_manager')
  confirmCost(
    @Param('id') id: string,
    @Body() data: { confirmedCost: number; emNotes?: string },
    @CurrentUser() user: any,
  ) {
    return this.requestsService.confirmCost(id, data, user.auth0Id);
  }
}
