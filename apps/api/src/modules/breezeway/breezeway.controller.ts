import { Controller, Get } from '@nestjs/common';
import { BreezeWayService } from './breezeway.service';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('api/v1/breezeway')
export class BreezeWayController {
  constructor(private breezeWayService: BreezeWayService) {}

  // Staff list backing the "assigned staff" dropdown in the EM experience editor.
  @Get('staff')
  @Roles('estate_manager')
  getStaff() {
    return this.breezeWayService.getStaff();
  }
}
