import {
  Controller,
  Post,
  Get,
  Patch,
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
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('api/v1/inquiries')
export class InquiriesController {
  constructor(private inquiriesService: InquiriesService) {}

  // Public — teaser website submits here
  @Post()
  @Public()
  submit(@Body() dto: CreateInquiryDto) {
    console.log('HIT INQUIRIES POST');
    return this.inquiriesService.submit(dto);
  }

  // EM views all inquiries
  @Get()
  @Roles('estate_manager', 'owner')
  findAll(@Query('status') status?: string) {
    return this.inquiriesService.findAll(status);
  }

  @Get(':id')
  @Roles('estate_manager', 'owner')
  findOne(@Param('id') id: string) {
    return this.inquiriesService.findOne(id);
  }

  // EM approves — passes vibe check
  @Patch(':id/approve')
  @Roles('estate_manager')
  approve(
    @Param('id') id: string,
    @Body() dto: ReviewInquiryDto,
    @CurrentUser() user: any,
  ) {
    return this.inquiriesService.approve(id, dto, user.auth0Id);
  }

  // EM declines
  @Patch(':id/decline')
  @Roles('estate_manager')
  decline(
    @Param('id') id: string,
    @Body() dto: DeclineInquiryDto,
    @CurrentUser() user: any,
  ) {
    return this.inquiriesService.decline(id, dto, user.auth0Id);
  }
}
