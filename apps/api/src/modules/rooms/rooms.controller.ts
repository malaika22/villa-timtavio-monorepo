import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  ParseIntPipe,
} from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('api/v1/rooms')
export class RoomsController {
  constructor(private roomsService: RoomsService) {}

  @Get()
  findAll() {
    return this.roomsService.findAll();
  }

  @Get('availability/:bookingId')
  findWithAvailability(@Param('bookingId') bookingId: string) {
    return this.roomsService.findWithAvailability(bookingId);
  }

  @Get(':number')
  findOne(@Param('number', ParseIntPipe) number: number) {
    return this.roomsService.findOne(number);
  }

  @Post()
  @Roles('estate_manager', 'owner')
  create(@Body() dto: CreateRoomDto) {
    return this.roomsService.create(dto);
  }

  @Patch(':number')
  @Roles('estate_manager', 'owner')
  update(
    @Param('number', ParseIntPipe) number: number,
    @Body() dto: UpdateRoomDto,
  ) {
    return this.roomsService.update(number, dto);
  }

  @Patch(':number/toggle-active')
  @Roles('estate_manager', 'owner')
  toggleActive(@Param('number', ParseIntPipe) number: number) {
    return this.roomsService.toggleActive(number);
  }
}
