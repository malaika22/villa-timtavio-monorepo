import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('api/v1/inventory')
export class InventoryController {
  constructor(private inventoryService: InventoryService) {}

  @Get()
  @Roles('estate_manager', 'owner')
  list() {
    return this.inventoryService.list();
  }

  @Post(':id/adjust')
  @Roles('estate_manager')
  adjust(
    @Param('id') id: string,
    @Body() body: { delta: number; reason?: string },
    @CurrentUser() user: any,
  ) {
    return this.inventoryService.adjustStock(
      id,
      Number(body.delta),
      user?.email ?? user?.auth0Id ?? 'em',
      body.reason,
    );
  }

  @Patch(':id/reorder')
  @Roles('estate_manager')
  reorder(@Param('id') id: string) {
    return this.inventoryService.markReordered(id);
  }
}
