import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCatalogItemDto } from './dto/create-catalog-item.dto';
import { UpdateCatalogItemDto } from './dto/update-catalog-item.dto';
import { CatalogCategory } from '@prisma/client';

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
      include: { vendor: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  async findOne(id: string) {
    const item = await this.prisma.catalogItem.findUnique({
      where: { id },
      include: {
        vendor: true,
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
      include: { vendor: true },
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
}
