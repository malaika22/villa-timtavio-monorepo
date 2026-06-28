import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async list(params: {
    search?: string;
    action?: string;
    from?: string;
    to?: string;
    take?: number;
  }) {
    const { search, action, from, to } = params;
    const take = Math.min(params.take ?? 100, 500);

    const where: Prisma.AuditLogWhereInput = {};

    if (action) where.action = action as Prisma.AuditLogWhereInput['action'];

    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }

    if (search) {
      where.OR = [
        { performedBy: { contains: search, mode: 'insensitive' } },
        { entityType: { contains: search, mode: 'insensitive' } },
        { entityId: { contains: search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take,
    });
  }
}
