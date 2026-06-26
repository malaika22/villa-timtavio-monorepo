import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PusherService, PUSHER_CHANNELS } from '../pusher/pusher.service';
import { CreateDiningRequestDto } from './dto/create-dining-request.dto';

@Injectable()
export class DiningService {
  constructor(
    private prisma: PrismaService,
    private pusher: PusherService,
  ) {}

  async findByBooking(bookingId: string) {
    return this.prisma.diningRequest.findMany({
      where: { bookingId, status: { not: 'CANCELLED' } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(
    bookingId: string,
    dto: CreateDiningRequestDto,
    requestedBy: { email: string; name: string },
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { primaryGuest: true },
    });
    if (!booking) throw new NotFoundException('Booking not found');

    if (dto.kind === 'SITTING' && (!dto.mealType || !dto.date || !dto.time)) {
      throw new BadRequestException(
        'A sitting requires a meal, date and time.',
      );
    }
    if (dto.kind === 'ORDER' && (!dto.items || dto.items.length === 0)) {
      throw new BadRequestException('An order requires at least one item.');
    }

    const created = await this.prisma.diningRequest.create({
      data: {
        bookingId,
        requestedByEmail: requestedBy.email,
        requestedByName: requestedBy.name,
        kind: dto.kind,
        mealType: dto.mealType,
        date: dto.date ? new Date(dto.date) : undefined,
        time: dto.time,
        partySize: dto.partySize,
        allergies: dto.allergies,
        specialRequests: dto.specialRequests,
        items: (dto.items as unknown as Prisma.InputJsonValue) ?? undefined,
        requestedFor: dto.requestedFor,
        notes: dto.notes,
      },
    });

    // Notify the estate manager dashboard in real time.
    await this.pusher.trigger(PUSHER_CHANNELS.emDashboard, 'dining.requested', {
      id: created.id,
      bookingId,
      kind: created.kind,
      guestName: requestedBy.name,
      mealType: created.mealType,
    });

    return created;
  }

  async confirm(id: string) {
    await this.ensureExists(id);
    return this.prisma.diningRequest.update({
      where: { id },
      data: { status: 'CONFIRMED' },
    });
  }

  async cancel(id: string) {
    await this.ensureExists(id);
    return this.prisma.diningRequest.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
  }

  private async ensureExists(id: string) {
    const found = await this.prisma.diningRequest.findUnique({ where: { id } });
    if (!found) throw new NotFoundException('Dining request not found');
    return found;
  }
}
