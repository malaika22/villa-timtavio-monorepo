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
  void tier;
  // Secondary guests DO see pricing on their own requests — they're asking the
  // primary to spend money and are settled with afterwards, so the estimate and
  // final cost have to be visible to them. findByBooking already scopes a
  // secondary to their own requests, so this never exposes the party's spend.
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

  // Guest — slots already taken for an experience, so the picker can grey them
  // out rather than accepting a date the estate will have to decline.
  @Get('bookings/:bookingId/taken-slots/:catalogItemId')
  getTakenSlots(
    @Param('bookingId') bookingId: string,
    @Param('catalogItemId') catalogItemId: string,
  ) {
    return this.requestsService.getTakenSlots(catalogItemId, bookingId);
  }

  // Guest — get requests for booking
  @Get('bookings/:bookingId')
  async findByBooking(
    @Param('bookingId') bookingId: string,
    @CurrentUser() user: any,
    @Query('filter') filter?: 'active' | 'all' | 'today',
  ) {
    // Secondaries see only their own requests; the primary (host) sees the
    // whole party's, so their Live Status / Party hub is a full overview.
    const scopeEmail =
      user?.guestTier === 'secondary' ? user?.email : undefined;
    const requests = await this.requestsService.findByBooking(
      bookingId,
      filter,
      scopeEmail,
    );
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

  // Primary member — revised quotes awaiting a second approval because they
  // came in materially above the estimate the primary originally approved.
  @Get('bookings/:bookingId/pending-quote-approval')
  @Roles('primary_member')
  getPendingQuoteApproval(@Param('bookingId') bookingId: string) {
    return this.requestsService.getPendingQuoteApproval(bookingId);
  }

  // Primary member — approve a revised quote (this is what creates the charge)
  @Post(':id/approve-quote')
  @Roles('primary_member')
  approveQuote(@Param('id') id: string, @CurrentUser() user: any) {
    return this.requestsService.approveQuote(id, user.email, user.bookingId);
  }

  // Primary member — decline a revised quote; nothing reaches the folio
  @Post(':id/decline-quote')
  @Roles('primary_member')
  declineQuote(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentUser() user: any,
  ) {
    return this.requestsService.declineQuote(
      id,
      user.email,
      user.bookingId,
      reason,
    );
  }

  // ─── Guest cancels ───────────────────────────────────────────────────────
  // Withdrawn outright if the estate hasn't confirmed it; otherwise recorded as
  // a request for Rodrigo, who has a vendor to unwind.
  @Post(':id/cancel')
  @Roles('primary_member', 'secondary_guest')
  guestCancel(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentUser() user: any,
  ) {
    return this.requestsService.guestCancel(
      id,
      user.email,
      user.bookingId,
      reason,
    );
  }

  // EM — what needs a price before it happens, soonest first
  @Get('em/needs-pricing')
  @Roles('estate_manager')
  getNeedsPricing(@Query('withinDays') withinDays?: string) {
    return this.requestsService.getNeedsPricing(
      withinDays ? Number(withinDays) : undefined,
    );
  }

  // EM — experiences a guest has asked to cancel
  @Get('em/cancellation-requests')
  @Roles('estate_manager')
  getCancellationRequests() {
    return this.requestsService.getCancellationRequests();
  }

  // EM — unwind it, recording any fee the vendor charged
  @Post(':id/confirm-cancellation')
  @Roles('estate_manager')
  confirmCancellation(
    @Param('id') id: string,
    @Body('cancellationFee') cancellationFee: number,
    @CurrentUser() user: any,
  ) {
    return this.requestsService.confirmCancellation(
      id,
      user.auth0Id,
      cancellationFee,
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

  // ─── QA TEST AFFORDANCE ──────────────────────────────────────────────────
  // Simulates the Breezeway "task completed" callback so the guest READY flow
  // (status + setup photo + notification) can be exercised without a field
  // worker finishing the task in Breezeway. Safe to remove once webhook-tested.
  @Patch(':id/mark-ready-test')
  @Roles('estate_manager')
  markReadyTest(@Param('id') id: string, @Body() body: { photoUrl?: string }) {
    return this.requestsService.markReady(
      id,
      body?.photoUrl ||
        'https://res.cloudinary.com/demo/image/upload/sample.jpg',
      'Estate staff (test)',
    );
  }
}
