import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCrmNoteDto } from './dto/create-crm-note.dto';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CrmService {
  constructor(private prisma: PrismaService) {}

  // ─── Get all notes for a guest ────────────────────────────────────────────────

  async findNotesByGuest(guestId: string) {
    const guest = await this.prisma.guest.findUnique({
      where: { id: guestId },
    });
    if (!guest) throw new NotFoundException(`Guest ${guestId} not found`);

    return this.prisma.crmNote.findMany({
      where: { guestId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ─── Add a CRM note ───────────────────────────────────────────────────────────

  async addNote(guestId: string, dto: CreateCrmNoteDto, addedBy: string) {
    const guest = await this.prisma.guest.findUnique({
      where: { id: guestId },
    });
    if (!guest) throw new NotFoundException(`Guest ${guestId} not found`);

    return this.prisma.crmNote.create({
      data: {
        guestId,
        note: dto.note,
        addedBy,
      },
    });
  }

  // ─── Mark note as stale (cannot delete — immutable audit trail) ───────────────

  async markStale(noteId: string, markedBy: string) {
    const note = await this.prisma.crmNote.findUnique({
      where: { id: noteId },
    });
    if (!note) throw new NotFoundException(`Note ${noteId} not found`);

    return this.prisma.crmNote.update({
      where: { id: noteId },
      data: { isStale: true },
    });
  }

  // ─── Add beverage preference ──────────────────────────────────────────────────

  async addBeveragePreference(
    guestId: string,
    data: { category: string; item: string; notes?: string },
    addedBy: string,
  ) {
    const guest = await this.prisma.guest.findUnique({
      where: { id: guestId },
    });
    if (!guest) throw new NotFoundException(`Guest ${guestId} not found`);

    // Append to existing preferences
    const existing = guest.beveragePreferences || '';
    const newPref = `${data.category}: ${data.item}${data.notes ? ` (${data.notes})` : ''}`;
    const updated = existing ? `${existing}\n${newPref}` : newPref;

    const updatedGuest = await this.prisma.guest.update({
      where: { id: guestId },
      data: { beveragePreferences: updated },
    });

    // Also log as a CRM note for audit trail
    await this.prisma.crmNote.create({
      data: {
        guestId,
        note: `Beverage preference added: ${newPref}`,
        addedBy,
      },
    });

    return updatedGuest;
  }

  // ─── Add dietary restriction ──────────────────────────────────────────────────

  async addDietaryRestriction(
    guestId: string,
    restriction: string,
    addedBy: string,
  ) {
    const guest = await this.prisma.guest.findUnique({
      where: { id: guestId },
    });
    if (!guest) throw new NotFoundException(`Guest ${guestId} not found`);

    if (guest.dietaryRestrictions.includes(restriction)) {
      return guest; // Already exists
    }

    const updated = await this.prisma.guest.update({
      where: { id: guestId },
      data: {
        dietaryRestrictions: [...guest.dietaryRestrictions, restriction],
      },
    });

    await this.prisma.crmNote.create({
      data: {
        guestId,
        note: `Dietary restriction added: ${restriction}`,
        addedBy,
      },
    });

    return updated;
  }

  // ─── Get pre-stock suggestions ────────────────────────────────────────────────

  async getPreStockSuggestions(guestId: string) {
    const guest = await this.prisma.guest.findUnique({
      where: { id: guestId },
    });
    if (!guest) throw new NotFoundException(`Guest ${guestId} not found`);

    const suggestions: any[] = [];

    if (guest.winePreferences) {
      suggestions.push({
        type: 'BEVERAGE',
        description: `Pre-stock: ${guest.winePreferences}`,
        quantity: 2,
        source: 'wine_preferences',
        completed: false,
      });
    }

    if (guest.beveragePreferences) {
      suggestions.push({
        type: 'BEVERAGE',
        description: `Prepare preferred beverages: ${guest.beveragePreferences}`,
        quantity: 1,
        source: 'beverage_preferences',
        completed: false,
      });
    }

    if (guest.pillarPreferences) {
      suggestions.push({
        type: 'ROOM_SETUP',
        description: guest.pillarPreferences,
        source: 'room_preferences',
        completed: false,
      });
    }

    return suggestions;
  }

  // ─── Get guest experience history ─────────────────────────────────────────────

  async getExperienceHistory(guestId: string) {
    const requests = await this.prisma.experienceRequest.findMany({
      where: {
        requestedByEmail:
          (
            await this.prisma.guest.findUnique({
              where: { id: guestId },
              select: { email: true },
            })
          )?.email || '',
        status: 'COMPLETED',
      },
      include: {
        catalogItem: {
          include: { vendor: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Summarize experience stats
    const experienceCounts: Record<string, number> = {};
    for (const req of requests) {
      const name = req.catalogItem.name;
      experienceCounts[name] = (experienceCounts[name] || 0) + 1;
    }

    const topExperiences = Object.entries(experienceCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    return {
      requests,
      topExperiences,
      totalCompleted: requests.length,
    };
  }
}
