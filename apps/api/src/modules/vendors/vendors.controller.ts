import { Controller, Get, Post, Patch, Param, Body } from '@nestjs/common';
import { VendorsService } from './vendors.service';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('api/v1/vendors')
export class VendorsController {
  constructor(private vendorsService: VendorsService) {}

  @Get()
  @Roles('estate_manager', 'owner')
  findAll() {
    return this.vendorsService.findAll();
  }

  @Get(':id')
  @Roles('estate_manager', 'owner')
  findOne(@Param('id') id: string) {
    return this.vendorsService.findOne(id);
  }

  @Post()
  @Roles('estate_manager')
  create(@Body() data: any) {
    return this.vendorsService.create(data);
  }

  @Patch(':id')
  @Roles('estate_manager')
  update(@Param('id') id: string, @Body() data: any) {
    return this.vendorsService.update(id, data);
  }

  @Patch(':id/status')
  @Roles('estate_manager')
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE',
  ) {
    return this.vendorsService.updateStatus(id, status);
  }

  @Post('ratings')
  @Roles('estate_manager')
  addRating(
    @Body()
    data: {
      experienceRequestId: string;
      rating: number;
      notes?: string;
    },
  ) {
    return this.vendorsService.addRating(
      data.experienceRequestId,
      data.rating,
      data.notes,
    );
  }
}
