import { Controller, Get, Post, Patch, Param, Body } from '@nestjs/common';

import { Roles } from '../auth/decorators/roles.decorator';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { VendorsService } from './vendors.service';

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
  create(@Body() data: CreateVendorDto) {
    return this.vendorsService.create(data);
  }

  @Patch(':id')
  @Roles('estate_manager', 'owner')
  update(@Param('id') id: string, @Body() data: UpdateVendorDto) {
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
