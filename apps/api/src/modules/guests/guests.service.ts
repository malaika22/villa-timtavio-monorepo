import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateGuestDnaDto } from './dto/update-guest-dna.dto';
import {
  ACTIVE_BOOKING_STATUSES,
  CURRENT_STAY_STATUSES,
} from '../bookings/booking-status.constants';
import { BookingStatus } from '@prisma/client';

import { derivePrimaryRoomNumber } from '../../common/booking-room.util';

@Injectable()
export class GuestsService {
  private readonly logger = new Logger(GuestsService.name);

  constructor(private prisma: PrismaService) {}

  // ─── Find guest with full DNA ─────────────────────────────────────────────────

  async findByEmail(email: string) {
    return this.prisma.guest.findUnique({
      where: { email },
      include: { crmNotes: { orderBy: { createdAt: 'desc' } } },
    });
  }

  async findById(id: string) {
    const guest = await this.prisma.guest.findUnique({
      where: { id },
      include: { crmNotes: { orderBy: { createdAt: 'desc' } } },
    });
    if (!guest) throw new NotFoundException(`Guest ${id} not found`);
    return guest;
  }

  // ─── Guest list for EM dashboard ─────────────────────────────────────────────

  async findCurrent() {
    const now = new Date();
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    return this.prisma.guest.findMany({
      where: {
        primaryBookings: {
          some: {
            OR: [
              {
                status: {
                  in: ACTIVE_BOOKING_STATUSES,
                },
              },
              {
                status: BookingStatus.CONFIRMED,
                checkIn: { lte: in7Days },
              },
            ],
          },
        },
      },
      include: {
        primaryBookings: {
          where: {
            OR: [
              { status: { in: CURRENT_STAY_STATUSES } },
              { status: BookingStatus.CONFIRMED, checkIn: { lte: in7Days } },
            ],
          },
          include: {
            manifestGuests: {
              select: { email: true, roomNumber: true },
            },
            experienceRequests: {
              where: {
                status: {
                  in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'READY'],
                },
              },
              select: { id: true, status: true },
            },
          },
          take: 1,
          orderBy: { checkIn: 'desc' },
        },
      },
    }).then((guests) =>
      guests.map((guest) => ({
        ...guest,
        primaryBookings: guest.primaryBookings.map((booking) => ({
          ...booking,
          primaryRoomNumber: derivePrimaryRoomNumber(
            booking.manifestGuests,
            guest.email,
          ),
        })),
      })),
    );
  }

  /**
   * Stays not yet arrived — the planning pipeline.
   *
   * The 90-day ceiling came out: guests can plan from the moment they book, so
   * a stay six months off can have a manifest, a party and a list of requested
   * experiences while being invisible to the estate. If someone is planning it,
   * Rodrigo needs to see it.
   *
   * Each booking carries how far that planning has got, so the list answers
   * "which stays need attention?" rather than only "who is coming?".
   */
  async findUpcoming() {
    const in7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const guests = await this.prisma.guest.findMany({
      where: {
        primaryBookings: {
          some: { status: 'CONFIRMED', checkIn: { gt: in7Days } },
        },
      },
      include: {
        primaryBookings: {
          where: { status: 'CONFIRMED', checkIn: { gt: in7Days } },
          take: 1,
          orderBy: { checkIn: 'asc' },
          include: {
            _count: { select: { manifestGuests: true } },
            experienceRequests: {
              where: { status: { notIn: ['CANCELLED'] } },
              select: { status: true, confirmedCost: true, estimatedMax: true },
            },
          },
        },
      },
    });

    return guests.map((guest) => {
      const booking = guest.primaryBookings[0];
      if (!booking) return guest;

      const requests = booking.experienceRequests;
      const awaitingPrice = requests.filter(
        (r) =>
          r.confirmedCost == null &&
          ['CONFIRMED', 'IN_PROGRESS', 'READY'].includes(r.status),
      ).length;

      // What the stay is shaping up to be worth: agreed prices where they
      // exist, the guest's estimate everywhere else.
      const plannedValue = requests.reduce(
        (sum, r) =>
          sum + Number(r.confirmedCost ?? r.estimatedMax ?? 0),
        0,
      );

      const { experienceRequests, _count, ...rest } = booking;
      void experienceRequests;

      return {
        ...guest,
        primaryBookings: [
          {
            ...rest,
            planning: {
              guestsAdded: _count.manifestGuests + 1, // the primary counts too
              experiencesPlanned: requests.length,
              awaitingPrice,
              plannedValue: Math.round(plannedValue * 100) / 100,
            },
          },
        ],
      };
    });
  }

  async findPast(search?: string) {
    return this.prisma.guest.findMany({
      where: {
        primaryBookings: { some: { status: 'CHECKED_OUT' } },
        ...(search && {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
      include: {
        primaryBookings: {
          where: { status: 'CHECKED_OUT' },
          orderBy: { checkOut: 'desc' },
          take: 1,
        },
      },
    });
  }

  // ─── Get full guest profile with booking history ──────────────────────────────

  async getProfile(id: string) {
    const guest = await this.prisma.guest.findUnique({
      where: { id },
      include: {
        crmNotes: { orderBy: { createdAt: 'desc' } },
        primaryBookings: {
          orderBy: { checkIn: 'desc' },
          include: {
            folioItems: true,
            experienceRequests: {
              include: { catalogItem: true },
              orderBy: { createdAt: 'desc' },
            },
          },
        },
      },
    });

    if (!guest) throw new NotFoundException(`Guest ${id} not found`);

    // Calculate lifetime stats
    const completedBookings = guest.primaryBookings.filter(
      (b) => b.status === 'CHECKED_OUT',
    );

    const lifetimeSpend = completedBookings.reduce((sum, b) => {
      const folioTotal = b.folioItems.reduce(
        (s, f) => s + Number(f.amount) * f.quantity,
        0,
      );
      return sum + folioTotal;
    }, 0);

    // Pre-stock suggestions based on Guest DNA
    const preStockSuggestions = this.generatePreStockSuggestions(guest);

    return {
      ...guest,
      stats: {
        totalVisits: completedBookings.length,
        lifetimeSpend,
        firstStay: completedBookings[completedBookings.length - 1]?.checkIn,
        lastStay: completedBookings[0]?.checkOut,
      },
      preStockSuggestions,
    };
  }

  // ─── Update Guest DNA ─────────────────────────────────────────────────────────

  async updateDna(id: string, dto: UpdateGuestDnaDto, updatedBy: string) {
    await this.findById(id);

    const updated = await this.prisma.guest.update({
      where: { id },
      data: dto,
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'BOOKING_UPDATED',
        entityType: 'Guest',
        entityId: id,
        performedBy: updatedBy,
        performedByRole: 'estate_manager',
        metadata: { action: 'dna_updated', fields: Object.keys(dto) } as any,
      },
    });

    return updated;
  }

  // ─── Pre-stock suggestions ────────────────────────────────────────────────────

  private generatePreStockSuggestions(guest: any) {
    const suggestions: any[] = [];

    if (guest.winePreferences) {
      suggestions.push({
        type: 'BEVERAGE',
        description: `Stock ${guest.winePreferences} based on past orders`,
        source: 'wine_preferences',
      });
    }

    if (guest.beveragePreferences) {
      suggestions.push({
        type: 'BEVERAGE',
        description: `Prepare ${guest.beveragePreferences}`,
        source: 'beverage_preferences',
      });
    }

    if (guest.pillarPreferences) {
      suggestions.push({
        type: 'ROOM_SETUP',
        description: guest.pillarPreferences,
        source: 'room_preferences',
      });
    }

    return suggestions;
  }
}
