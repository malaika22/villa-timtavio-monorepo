import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  async list() {
    return this.prisma.inventoryItem.findMany({
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
  }

  async adjustStock(id: string, delta: number, performedBy: string, reason?: string) {
    if (!Number.isInteger(delta) || delta === 0) {
      throw new BadRequestException('delta must be a non-zero integer');
    }
    const item = await this.prisma.inventoryItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Inventory item not found');

    const nextStock = Math.max(0, item.currentStock + delta);

    const [updated] = await this.prisma.$transaction([
      this.prisma.inventoryItem.update({
        where: { id },
        data: {
          currentStock: nextStock,
          // Receiving stock clears the on-order flag.
          ...(delta > 0 ? { isOnOrder: false, onOrderSince: null } : {}),
        },
      }),
      this.prisma.stockMovement.create({
        data: { inventoryItemId: id, delta, reason, performedBy },
      }),
    ]);

    return updated;
  }

  async markReordered(id: string) {
    const item = await this.prisma.inventoryItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Inventory item not found');

    return this.prisma.inventoryItem.update({
      where: { id },
      data: { isOnOrder: true, onOrderSince: new Date() },
    });
  }
}
