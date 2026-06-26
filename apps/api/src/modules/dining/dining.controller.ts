import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { DiningService } from './dining.service';
import { CreateDiningRequestDto } from './dto/create-dining-request.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('api/v1/dining')
export class DiningController {
  constructor(private diningService: DiningService) {}

  // Guest + EM — list dining requests for a booking
  @Get('bookings/:bookingId')
  findByBooking(@Param('bookingId') bookingId: string) {
    return this.diningService.findByBooking(bookingId);
  }

  // Guest — create a sitting reservation or a snack/drink order
  @Post('bookings/:bookingId')
  create(
    @Param('bookingId') bookingId: string,
    @Body() dto: CreateDiningRequestDto,
    @CurrentUser() user: any,
  ) {
    return this.diningService.create(bookingId, dto, {
      email: user.email,
      name: user.firstName || user.email,
    });
  }

  // EM — confirm a dining request
  @Patch(':id/confirm')
  @HttpCode(HttpStatus.OK)
  @Roles('estate_manager')
  confirm(@Param('id') id: string) {
    return this.diningService.confirm(id);
  }

  // Guest or EM — cancel a dining request
  @Patch(':id/cancel')
  @HttpCode(HttpStatus.OK)
  cancel(@Param('id') id: string) {
    return this.diningService.cancel(id);
  }
}
