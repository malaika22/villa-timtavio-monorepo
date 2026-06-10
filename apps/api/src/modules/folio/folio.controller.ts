import { Controller, Get, Post, Patch, Param, Body } from '@nestjs/common';
import { FolioService } from './folio.service';
import { CreateFolioItemDto } from './dto/create-folio-item.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('api/v1/folio')
export class FolioController {
  constructor(private folioService: FolioService) {}

  @Get(':bookingId')
  getForBooking(@Param('bookingId') bookingId: string) {
    return this.folioService.getForBooking(bookingId);
  }

  @Post(':bookingId/charges')
  @Roles('estate_manager')
  logCharge(
    @Param('bookingId') bookingId: string,
    @Body() dto: CreateFolioItemDto,
    @CurrentUser() user: any,
  ) {
    return this.folioService.logCharge(bookingId, dto, user.auth0Id);
  }

  @Patch('charges/:itemId')
  @Roles('estate_manager')
  editCharge(
    @Param('itemId') itemId: string,
    @Body() data: { description?: string; amount?: number },
    @CurrentUser() user: any,
  ) {
    return this.folioService.editCharge(itemId, data, user.auth0Id);
  }

  @Post(':bookingId/checkout')
  @Roles('estate_manager')
  checkout(@Param('bookingId') bookingId: string, @CurrentUser() user: any) {
    return this.folioService.checkout(bookingId, user.auth0Id);
  }
}
