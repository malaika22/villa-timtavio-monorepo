import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { InquiriesService } from './inquiries.service';
import {
  CreateInquiryDto,
  ReviewInquiryDto,
  DeclineInquiryDto,
} from './dto/create-inquiry.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';

@Controller('api/v1/inquiries')
export class InquiriesController {
  constructor(private inquiriesService: InquiriesService) {}

  // ─── Public — teaser website form ────────────────────────────────────────
  @Post()
  @Public()
  submit(@Body() dto: CreateInquiryDto) {
    return this.inquiriesService.submit(dto);
  }

  // ─── EM views all inquiries ───────────────────────────────────────────────
  @Get()
  @Roles('estate_manager', 'owner')
  findAll(@Query('status') status?: string) {
    return this.inquiriesService.findAll(status);
  }

  // ─── EM views single inquiry ──────────────────────────────────────────────
  @Get(':id')
  @Roles('estate_manager', 'owner')
  findOne(@Param('id') id: string) {
    return this.inquiriesService.findOne(id);
  }

  // ─── EM approves inquiry (passes vibe check) ─────────────────────────────
  @Patch(':id/approve')
  @Roles('estate_manager')
  approve(
    @Param('id') id: string,
    @Body() dto: ReviewInquiryDto,
    @CurrentUser() user: any,
  ) {
    return this.inquiriesService.approve(id, dto, user.auth0Id);
  }

  // ─── EM declines inquiry ──────────────────────────────────────────────────
  @Patch(':id/decline')
  @Roles('estate_manager')
  decline(
    @Param('id') id: string,
    @Body() dto: DeclineInquiryDto,
    @CurrentUser() user: any,
  ) {
    return this.inquiriesService.decline(id, dto, user.auth0Id);
  }

  // ─── EM marks lookbook sent ───────────────────────────────────────────────
  @Patch(':id/lookbook-sent')
  @Roles('estate_manager')
  markLookbookSent(@Param('id') id: string, @CurrentUser() user: any) {
    return this.inquiriesService.markLookbookSent(id, user.auth0Id);
  }

  // ─── EM sends the lookbook + payment link (the guest's confirmation) ──────
  @Post(':id/send-lookbook')
  @Roles('estate_manager')
  sendLookbook(@Param('id') id: string, @CurrentUser() user: any) {
    return this.inquiriesService.sendLookbookEmail(id, user.auth0Id);
  }

  // ─── EM marks payment link sent ───────────────────────────────────────────
  @Patch(':id/payment-link-sent')
  @Roles('estate_manager')
  markPaymentLinkSent(
    @Param('id') id: string,
    @Body('stripePaymentLink') stripePaymentLink: string,
    @CurrentUser() user: any,
  ) {
    return this.inquiriesService.markPaymentLinkSent(
      id,
      stripePaymentLink,
      user.auth0Id,
    );
  }

  // ─── EM deletes inquiry ───────────────────────────────────────────────────
  @Delete(':id')
  @Roles('estate_manager')
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.inquiriesService.remove(id, user.auth0Id);
  }
}
