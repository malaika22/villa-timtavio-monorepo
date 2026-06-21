import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';

@Injectable()
export class RoomsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.room.findMany({
      orderBy: { number: 'asc' },
    });
  }

  async findOne(number: number) {
    const room = await this.prisma.room.findUnique({ where: { number } });
    if (!room) throw new NotFoundException(`Room ${number} not found`);
    return room;
  }

  async findWithAvailability(bookingId: string) {
    const rooms = await this.prisma.room.findMany({
      orderBy: { number: 'asc' },
      include: {
        manifestGuests: {
          where: { bookingId },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return rooms.map((room) => ({
      ...room,
      assignedCount: room.manifestGuests.length,
      availableCapacity: room.capacity - room.manifestGuests.length,
      isFull: room.manifestGuests.length >= room.capacity,
    }));
  }

  async create(dto: CreateRoomDto) {
    const existing = await this.prisma.room.findUnique({
      where: { number: dto.number },
    });
    if (existing) {
      throw new ConflictException(`Room ${dto.number} already exists`);
    }

    return this.prisma.room.create({ data: dto });
  }

  async update(number: number, dto: UpdateRoomDto) {
    await this.findOne(number);
    return this.prisma.room.update({
      where: { number },
      data: dto,
    });
  }

  async toggleActive(number: number) {
    const room = await this.findOne(number);
    return this.prisma.room.update({
      where: { number },
      data: { isActive: !room.isActive },
    });
  }
}
