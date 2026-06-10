import { Controller, Get, Patch, Param, Body, Query } from '@nestjs/common';
import { GuestsService } from './guests.service';
import { UpdateGuestDnaDto } from './dto/update-guest-dna.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('api/v1/guests')
export class GuestsController {
  constructor(private guestsService: GuestsService) {}

  @Get('current')
  @Roles('estate_manager', 'owner')
  findCurrent() {
    return this.guestsService.findCurrent();
  }

  @Get('upcoming')
  @Roles('estate_manager', 'owner')
  findUpcoming() {
    return this.guestsService.findUpcoming();
  }

  @Get('past')
  @Roles('estate_manager', 'owner')
  findPast(@Query('search') search?: string) {
    return this.guestsService.findPast(search);
  }

  @Get(':id/profile')
  @Roles('estate_manager', 'owner')
  getProfile(@Param('id') id: string) {
    return this.guestsService.getProfile(id);
  }

  @Patch(':id/dna')
  @Roles('estate_manager')
  updateDna(
    @Param('id') id: string,
    @Body() dto: UpdateGuestDnaDto,
    @CurrentUser() user: any,
  ) {
    return this.guestsService.updateDna(id, dto, user.auth0Id);
  }
}
