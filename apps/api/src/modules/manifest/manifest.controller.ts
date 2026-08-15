// apps/api/src/manifest/manifest.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ManifestService } from './manifest.service';
import { CreateManifestGuestDto } from './dto/create-manifest-guest.dto';
import { UpdateManifestGuestDto } from './dto/update-manifest-guest.dto';
import { UpsertManifestDraftDto } from './dto/upsert-manifest-draft.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/jwt.strategy';

@Controller('api/v1/manifest')
export class ManifestController {
  constructor(private manifestService: ManifestService) {}

  // ─── Get manifest form options (dietary, relationships) ──────────────────
  // Must be declared BEFORE :bookingId to avoid param capture

  @Get('options')
  getOptions() {
    return this.manifestService.getOptions();
  }

  // ─── Guest PWA: Get full manifest ────────────────────────────────────────
  // Both primary member and estate manager can view

  @Get(':bookingId')
  getManifest(@Param('bookingId') bookingId: string, @CurrentUser() user: any) {
    return this.manifestService.getManifest(bookingId, user.email);
  }

  // ─── Draft endpoints ──────────────────────────────────────────────────────

  @Get(':bookingId/draft')
  @Roles('primary_member', 'estate_manager')
  getDraft(@Param('bookingId') bookingId: string) {
    return this.manifestService.getDraft(bookingId);
  }

  @Put(':bookingId/draft')
  @HttpCode(HttpStatus.OK)
  @Roles('primary_member')
  upsertDraft(
    @Param('bookingId') bookingId: string,
    @Body() dto: UpsertManifestDraftDto,
  ) {
    return this.manifestService.upsertDraft(bookingId, dto);
  }

  @Delete(':bookingId/draft')
  @HttpCode(HttpStatus.OK)
  @Roles('primary_member')
  deleteDraft(@Param('bookingId') bookingId: string) {
    return this.manifestService.deleteDraft(bookingId);
  }

  // ─── Guest PWA: Primary updates their own manifest details ───────────────
  // Room assignment + dietary/allergy/beverage preferences for the primary

  @Patch(':bookingId/primary-details')
  @Roles('primary_member', 'estate_manager')
  updatePrimaryDetails(
    @Param('bookingId') bookingId: string,
    @Body()
    dto: {
      roomNumber?: number | null;
      dietaryRestrictions?: string[];
      allergies?: string | null;
      beveragePreferences?: string | null;
    },
    @CurrentUser() user: any,
  ) {
    return this.manifestService.updatePrimaryDetails(bookingId, dto, user.email);
  }

  // ─── Estate Manager: set a secondary guest's presence status (REQ-5) ─────

  @Patch(':bookingId/guests/:guestId/arrival-status')
  @Roles('estate_manager')
  setGuestArrivalStatus(
    @Param('guestId') guestId: string,
    @Body() body: { status: string },
  ) {
    return this.manifestService.setGuestArrivalStatus(guestId, body.status);
  }

  // ─── Estate Manager: set the primary member's presence status (REQ-5) ────

  @Patch(':bookingId/primary-arrival-status')
  @Roles('estate_manager')
  setPrimaryArrivalStatus(
    @Param('bookingId') bookingId: string,
    @Body() body: { status: string },
  ) {
    return this.manifestService.setPrimaryArrivalStatus(
      bookingId,
      body.status,
    );
  }

  // ─── Guest PWA: Add a guest ───────────────────────────────────────────────
  // Primary member only

  @Post(':bookingId/guests')
  @Roles('primary_member', 'estate_manager')
  addGuest(
    @Param('bookingId') bookingId: string,
    @Body() dto: CreateManifestGuestDto,
    @CurrentUser() user: any,
  ) {
    return this.manifestService.addGuest(bookingId, dto, user.email);
  }

  // ─── Guest PWA: Update a guest ────────────────────────────────────────────

  /**
   * Also reachable by a secondary guest, for their own record only.
   *
   * They were previously locked out entirely, which meant the one person who
   * knows their own allergy had to text the lead guest and have it typed in
   * for them. The service narrows what a self-edit may touch — see
   * SELF_EDITABLE — so opening the route up doesn't open up the room plan or
   * anybody else's details.
   */
  @Patch(':bookingId/guests/:guestId')
  @Roles('primary_member', 'estate_manager', 'secondary_guest')
  updateGuest(
    @Param('bookingId') bookingId: string,
    @Param('guestId') guestId: string,
    @Body() dto: UpdateManifestGuestDto,
    @CurrentUser() user: AuthUser,
  ) {
    const selfEditOnly = user.guestTier === 'secondary';

    return this.manifestService.updateGuest(
      bookingId,
      guestId,
      dto,
      user.email,
      selfEditOnly,
    );
  }

  // ─── Guest PWA: Remove a guest ────────────────────────────────────────────

  @Delete(':bookingId/guests/:guestId')
  @HttpCode(HttpStatus.OK)
  @Roles('primary_member', 'estate_manager')
  removeGuest(
    @Param('bookingId') bookingId: string,
    @Param('guestId') guestId: string,
    @CurrentUser() user: any,
  ) {
    return this.manifestService.removeGuest(bookingId, guestId, user.email);
  }

  // ─── Guest PWA: Submit manifest ───────────────────────────────────────────
  // Primary member taps "Submit guest list"

  @Post(':bookingId/submit')
  @Roles('primary_member')
  submitManifest(
    @Param('bookingId') bookingId: string,
    @CurrentUser() user: any,
  ) {
    return this.manifestService.submitManifest(bookingId, user.email);
  }

  // ─── Estate Manager: acknowledge the brief ───────────────────────────────
  // Replaces the old `approve` step, which gated nothing and could only ever
  // be clicked in good faith.

  @Post(':bookingId/brief-viewed')
  @Roles('estate_manager')
  markBriefViewed(
    @Param('bookingId') bookingId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.manifestService.markBriefViewed(
      bookingId,
      user.email ?? user.auth0Id,
    );
  }

  // ─── Estate Manager: Generate chef's brief ───────────────────────────────

  @Get(':bookingId/chefs-brief')
  @Roles('estate_manager', 'owner')
  getChefsBrief(@Param('bookingId') bookingId: string) {
    return this.manifestService.generateChefsBrief(bookingId);
  }

  // ─── Estate Manager: Resend PWA link to a specific guest ─────────────────

  @Post(':bookingId/guests/:guestId/resend-link')
  @Roles('estate_manager')
  resendGuestLink(
    @Param('bookingId') bookingId: string,
    @Param('guestId') guestId: string,
    @CurrentUser() user: any,
  ) {
    return this.manifestService.resendGuestLink(
      bookingId,
      guestId,
      user.auth0Id,
    );
  }

  // ─── System: Mark link as opened (called from PWA auth callback) ─────────

  @Post('link-opened')
  markLinkOpened(@Body() body: { bookingId: string; email: string }) {
    return this.manifestService.markLinkOpened(body.bookingId, body.email);
  }
}
