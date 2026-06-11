import {
  Injectable,
  NotFoundException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCatalogItemDto } from './dto/create-catalog-item.dto';
import { UpdateCatalogItemDto } from './dto/update-catalog-item.dto';
import { CatalogCategory } from '@prisma/client';
import * as csv from 'csv-parse/sync';
import { getErrorMessage } from '../../commons/utils/error.util';

@Injectable()
export class CatalogService {
  private readonly logger = new Logger(CatalogService.name);

  constructor(private prisma: PrismaService) {}

  // ─── Guest PWA: Get active catalog (no prices) ───────────────────────────────

  async findAllActive(category?: CatalogCategory) {
    return this.prisma.catalogItem.findMany({
      where: {
        isActive: true,
        ...(category && { category }),
      },
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            role: true,
            photoUrl: true,
            averageRating: true,
          },
        },
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  // ─── Get included services only ───────────────────────────────────────────────

  async findIncluded() {
    return this.prisma.catalogItem.findMany({
      where: { isActive: true, isIncluded: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  // ─── EM Dashboard: Get all (including inactive) ───────────────────────────────

  async findAll(category?: CatalogCategory) {
    return this.prisma.catalogItem.findMany({
      where: { ...(category && { category }) },
      include: { vendor: true, experienceCategory: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  async findOne(id: string) {
    const item = await this.prisma.catalogItem.findUnique({
      where: { id },
      include: {
        vendor: true,
        experienceCategory: true,
        experienceRequests: {
          select: {
            id: true,
            status: true,
            createdAt: true,
          },
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!item) throw new NotFoundException(`Catalog item ${id} not found`);
    return item;
  }

  // ─── Get experience detail with guest DNA personalization ─────────────────────

  async findOneForGuest(id: string, guestEmail: string) {
    const item = await this.findOne(id);
    const guest = await this.prisma.guest.findUnique({
      where: { email: guestEmail },
    });

    let personalization: string | null = null;

    if (guest && item.vendor) {
      // Check if guest has booked this vendor before
      const previousBookings = await this.prisma.experienceRequest.count({
        where: {
          requestedByEmail: guestEmail,
          catalogItem: { vendorId: item.vendorId },
          status: 'COMPLETED',
        },
      });

      if (previousBookings > 0) {
        personalization = `You've experienced this ${previousBookings} time${previousBookings > 1 ? 's' : ''} before`;
      }
    }

    return { ...item, personalization };
  }

  async create(dto: CreateCatalogItemDto, createdBy: string) {
    const item = await this.prisma.catalogItem.create({
      data: { ...dto, createdBy },
      include: { vendor: true, experienceCategory: true },
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'CATALOG_ITEM_CREATED',
        entityType: 'CatalogItem',
        entityId: item.id,
        performedBy: createdBy,
        performedByRole: 'estate_manager',
        afterState: item as any,
      },
    });

    return item;
  }

  async update(id: string, dto: UpdateCatalogItemDto, updatedBy: string) {
    const before = await this.findOne(id);

    const item = await this.prisma.catalogItem.update({
      where: { id },
      data: dto,
      include: { vendor: true },
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'CATALOG_ITEM_UPDATED',
        entityType: 'CatalogItem',
        entityId: id,
        performedBy: updatedBy,
        performedByRole: 'estate_manager',
        beforeState: before as any,
        afterState: item as any,
      },
    });

    return item;
  }

  async toggleActive(id: string, updatedBy: string) {
    const item = await this.findOne(id);
    return this.update(id, { isActive: !item.isActive }, updatedBy);
  }

  async remove(id: string, deletedBy: string) {
    await this.findOne(id);

    // Soft delete — set inactive rather than hard delete
    const item = await this.prisma.catalogItem.update({
      where: { id },
      data: { isActive: false },
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'CATALOG_ITEM_DELETED',
        entityType: 'CatalogItem',
        entityId: id,
        performedBy: deletedBy,
        performedByRole: 'estate_manager',
      },
    });

    return item;
  }

  // ─── Menu Items CRUD ──────────────────────────────────────────────────────────

  async findAllMenuItems(category?: string) {
    return this.prisma.menuItem.findMany({
      where: {
        isActive: true,
        ...(category && { category: category as any }),
      },
      orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
    });
  }

  async createMenuItem(data: any, createdBy: string) {
    return this.prisma.menuItem.create({
      data: { ...data, createdBy },
    });
  }

  async updateMenuItem(id: string, data: any) {
    return this.prisma.menuItem.update({ where: { id }, data });
  }

  async removeMenuItem(id: string) {
    return this.prisma.menuItem.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // ─── Recommendations CRUD ─────────────────────────────────────────────────────

  async findAllRecommendations(category?: string) {
    return this.prisma.recommendation.findMany({
      where: {
        isActive: true,
        ...(category && { category }),
      },
      orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }],
    });
  }

  async createRecommendation(data: any, createdBy: string) {
    return this.prisma.recommendation.create({
      data: { ...data, createdBy },
    });
  }

  async updateRecommendation(id: string, data: any) {
    return this.prisma.recommendation.update({ where: { id }, data });
  }

  // ─── CSV Import ───────────────────────────────────────────────────────────

  async importFromCsv(csvContent: string, importedBy: string) {
    const results = {
      imported: 0,
      skipped: 0,
      errors: [] as string[],
      items: [] as any[],
    };

    let records: any[];

    try {
      records = csv.parse(csvContent, {
        columns: true, // Use first row as headers
        skip_empty_lines: true,
        trim: true,
      });
    } catch (err) {
      throw new BadRequestException(
        `Invalid CSV format: ${getErrorMessage(err)}`,
      );
    }

    // Map Rodrigo's CSV column names to our schema
    // CSV columns: Category, Experiene Name, The Pitch, Duration, Price (USD), Vendor
    for (const record of records) {
      try {
        const categoryMapped = this.mapCsvCategory(record['Category']);
        const name = record['Experiene Name']?.trim(); // Note: typo in Rodrigo's CSV header

        if (!name) {
          results.skipped++;
          results.errors.push(`Row skipped: missing experience name`);
          continue;
        }

        // Check for duplicate
        const existing = await this.prisma.catalogItem.findFirst({
          where: { name: { equals: name, mode: 'insensitive' } },
        });

        if (existing) {
          results.skipped++;
          results.errors.push(`"${name}" already exists — skipped`);
          continue;
        }

        // Determine if chargeable based on price field
        const priceField = record['Price (USD)']?.trim();
        const isMarketPrice =
          priceField === 'Market Price' || priceField === 'Market';
        const isIncluded = !priceField || priceField === '';

        // Parse duration
        const durationRaw = record['Duration']?.trim();
        const durationLabel = durationRaw || null;
        const durationMinutes = this.parseDurationToMinutes(durationRaw);

        // Parse vendor
        const vendorName = record['Vendor']?.trim() || null;
        let vendorId: string | null = null;

        if (vendorName) {
          const vendor = await this.prisma.vendor.findFirst({
            where: { name: { contains: vendorName, mode: 'insensitive' } },
          });
          if (vendor) vendorId = vendor.id;
        }

        const item = await this.prisma.catalogItem.create({
          data: {
            name,
            category: categoryMapped,
            description: record['The Pitch']?.trim() || '',
            shortDescription:
              record['The Pitch']?.trim()?.substring(0, 120) || '',
            isIncluded,
            isActive: true,
            durationLabel,
            durationMinutes,
            vendorId,
            createdBy: importedBy,
            sortOrder: results.imported,
          },
        });

        results.imported++;
        results.items.push({
          id: item.id,
          name: item.name,
          category: item.category,
          isIncluded: item.isIncluded,
        });
      } catch (err) {
        results.errors.push(
          `Error importing "${record['Experiene Name']}": ${getErrorMessage(err)}`,
        );
        results.skipped++;
      }
    }

    // Audit log
    await this.prisma.auditLog.create({
      data: {
        action: 'CATALOG_ITEM_CREATED',
        entityType: 'CatalogItem',
        entityId: 'bulk_import',
        performedBy: importedBy,
        performedByRole: 'estate_manager',
        metadata: {
          imported: results.imported,
          skipped: results.skipped,
          totalRows: records.length,
        } as any,
      },
    });

    return results;
  }

  // ─── Map Rodrigo's CSV category names to our enum ────────────────────────

  private mapCsvCategory(csvCategory: string): CatalogCategory {
    const map: Record<string, CatalogCategory> = {
      // Rodrigo's exact category names from the CSV
      'The Fleet': 'ARRIVAL_TRANSIT',
      'Arrival & The Vibe': 'ARRIVAL_TRANSIT',
      "Billionaire's Pantry": 'CULINARY_AGAVE',
      'Reserve Cellar': 'CULINARY_AGAVE',
      'Culinary & Agave': 'CULINARY_AGAVE',
      'Oaxaca Immersions': 'EXCURSIONS',
      'Raw Pacific': 'OCEAN_ADVENTURE',
      'Vanguard Wellness': 'WELLNESS',
      // Fallbacks
      Culinary: 'CULINARY_AGAVE',
      Water: 'OCEAN_ADVENTURE',
      Wellness: 'WELLNESS',
      Private: 'PRIVATE',
      Culture: 'EXCURSIONS',
      Wine: 'CULINARY_AGAVE',
      Dining: 'CULINARY_AGAVE',
    };

    return map[csvCategory?.trim()] || 'PRIVATE';
  }

  // ─── Parse duration string to minutes ────────────────────────────────────

  private parseDurationToMinutes(duration: string | null): number | null {
    if (!duration) return null;

    const d = duration.toLowerCase().trim();

    if (d.includes('airport run')) return 120;
    if (d.includes('daily')) return 480;
    if (d.includes('market')) return null;
    if (d.includes('1 night')) return 1440;

    const hrMatch = d.match(/(\d+(?:\.\d+)?)\s*hr/);
    if (hrMatch) return Math.round(parseFloat(hrMatch[1]) * 60);

    const hrRangeMatch = d.match(/(\d+)-(\d+)\s*hr/);
    if (hrRangeMatch) {
      const avg = (parseInt(hrRangeMatch[1]) + parseInt(hrRangeMatch[2])) / 2;
      return Math.round(avg * 60);
    }

    const minMatch = d.match(/(\d+)\s*min/);
    if (minMatch) return parseInt(minMatch[1]);

    return null;
  }
}
