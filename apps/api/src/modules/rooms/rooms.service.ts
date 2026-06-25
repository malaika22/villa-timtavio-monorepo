import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
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

    return rooms.map(({ manifestGuests, ...room }) => ({
      ...room,
      assignedGuests: manifestGuests,
      assignedCount: manifestGuests.length,
      availableCapacity: room.capacity - manifestGuests.length,
      isFull: manifestGuests.length >= room.capacity,
    }));
  }

  async create(dto: CreateRoomDto) {
    const existing = await this.prisma.room.findUnique({
      where: { number: dto.number },
    });
    if (existing) {
      throw new ConflictException(`Room ${dto.number} already exists`);
    }

    const { beds, ...rest } = dto;
    return this.prisma.room.create({
      data: {
        ...rest,
        ...(beds !== undefined ? { beds: beds as unknown as Prisma.InputJsonValue } : {}),
      },
    });
  }

  async update(number: number, dto: UpdateRoomDto) {
    await this.findOne(number);
    const { beds, ...rest } = dto;
    return this.prisma.room.update({
      where: { number },
      data: {
        ...rest,
        ...(beds !== undefined ? { beds: beds as unknown as Prisma.InputJsonValue } : {}),
      },
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
