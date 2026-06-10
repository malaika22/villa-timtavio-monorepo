import { Controller, Get, Post, Patch, Param, Body } from '@nestjs/common';
import { CrmService } from './crm.service';
import { CreateCrmNoteDto } from './dto/create-crm-note.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('api/v1/crm')
export class CrmController {
  constructor(private crmService: CrmService) {}

  @Get('guests/:guestId/notes')
  @Roles('estate_manager', 'owner')
  findNotes(@Param('guestId') guestId: string) {
    return this.crmService.findNotesByGuest(guestId);
  }

  @Post('guests/:guestId/notes')
  @Roles('estate_manager')
  addNote(
    @Param('guestId') guestId: string,
    @Body() dto: CreateCrmNoteDto,
    @CurrentUser() user: any,
  ) {
    return this.crmService.addNote(guestId, dto, user.auth0Id);
  }

  @Patch('notes/:noteId/stale')
  @Roles('estate_manager')
  markStale(@Param('noteId') noteId: string, @CurrentUser() user: any) {
    return this.crmService.markStale(noteId, user.auth0Id);
  }

  @Post('guests/:guestId/beverage-preference')
  @Roles('estate_manager')
  addBeveragePreference(
    @Param('guestId') guestId: string,
    @Body() data: { category: string; item: string; notes?: string },
    @CurrentUser() user: any,
  ) {
    return this.crmService.addBeveragePreference(guestId, data, user.auth0Id);
  }

  @Post('guests/:guestId/dietary-restriction')
  @Roles('estate_manager')
  addDietaryRestriction(
    @Param('guestId') guestId: string,
    @Body('restriction') restriction: string,
    @CurrentUser() user: any,
  ) {
    return this.crmService.addDietaryRestriction(
      guestId,
      restriction,
      user.auth0Id,
    );
  }

  @Get('guests/:guestId/pre-stock-suggestions')
  @Roles('estate_manager')
  getPreStockSuggestions(@Param('guestId') guestId: string) {
    return this.crmService.getPreStockSuggestions(guestId);
  }

  @Get('guests/:guestId/experience-history')
  @Roles('estate_manager', 'owner')
  getExperienceHistory(@Param('guestId') guestId: string) {
    return this.crmService.getExperienceHistory(guestId);
  }
}
