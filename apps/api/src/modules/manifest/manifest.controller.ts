// apps/api/src/manifest/manifest.controller.ts
import {
  Controller,
  Get,
  Post,
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
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('api/v1/manifest')
export class ManifestController {
  constructor(private manifestService: ManifestService) {}

  // ─── Guest PWA: Get full manifest ────────────────────────────────────────
  // Both primary member and estate manager can view

  @Get(':bookingId')
  getManifest(@Param('bookingId') bookingId: string, @CurrentUser() user: any) {
    return this.manifestService.getManifest(bookingId, user.email);
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

  @Patch(':bookingId/guests/:guestId')
  @Roles('primary_member', 'estate_manager')
  updateGuest(
    @Param('bookingId') bookingId: string,
    @Param('guestId') guestId: string,
    @Body() dto: UpdateManifestGuestDto,
    @CurrentUser() user: any,
  ) {
    return this.manifestService.updateGuest(
      bookingId,
      guestId,
      dto,
      user.email,
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

  // ─── Estate Manager: Approve manifest + send secondary links ─────────────

  @Post(':bookingId/approve')
  @Roles('estate_manager')
  approveManifest(
    @Param('bookingId') bookingId: string,
    @CurrentUser() user: any,
  ) {
    return this.manifestService.approveManifest(bookingId, user.auth0Id);
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
