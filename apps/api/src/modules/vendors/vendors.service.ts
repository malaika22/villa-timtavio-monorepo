import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class VendorsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.vendor.findMany({
      include: {
        catalogItems: { select: { id: true, name: true, category: true } },
        _count: { select: { vendorRatings: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { id },
      include: {
        catalogItems: true,
        vendorRatings: {
          include: {
            experienceRequest: {
              include: { catalogItem: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!vendor) throw new NotFoundException(`Vendor ${id} not found`);
    return vendor;
  }

  async create(data: any) {
    return this.prisma.vendor.create({ data });
  }

  async update(id: string, data: any) {
    await this.findOne(id);
    return this.prisma.vendor.update({ where: { id }, data });
  }

  async updateStatus(id: string, status: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE') {
    await this.findOne(id);
    return this.prisma.vendor.update({ where: { id }, data: { status } });
  }

  async addRating(experienceRequestId: string, rating: number, notes?: string) {
    const request = await this.prisma.experienceRequest.findUnique({
      where: { id: experienceRequestId },
      include: { catalogItem: { include: { vendor: true } } },
    });
    if (!request?.catalogItem?.vendorId) {
      throw new NotFoundException('No vendor associated with this experience');
    }

    const vendorRating = await this.prisma.vendorRating.create({
      data: {
        vendorId: request.catalogItem.vendorId,
        experienceRequestId,
        rating,
        notes,
      },
    });

    // Recalculate vendor average rating
    const allRatings = await this.prisma.vendorRating.findMany({
      where: { vendorId: request.catalogItem.vendorId },
    });
    const avg =
      allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length;

    await this.prisma.vendor.update({
      where: { id: request.catalogItem.vendorId },
      data: {
        averageRating: avg,
        totalBookings: { increment: 1 },
      },
    });

    return vendorRating;
  }
}
