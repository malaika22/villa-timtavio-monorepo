// apps/api/src/catalog/catalog.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { CreateCatalogItemDto } from './dto/create-catalog-item.dto';
import { UpdateCatalogItemDto } from './dto/update-catalog-item.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CatalogCategory } from '@prisma/client';

@Controller('api/v1/catalog')
export class CatalogController {
  constructor(private catalogService: CatalogService) {}

  // Guest PWA routes
  @Get()
  findActive(@Query('category') category?: CatalogCategory) {
    return this.catalogService.findAllActive(category);
  }

  @Get('included')
  findIncluded() {
    return this.catalogService.findIncluded();
  }

  @Get('menus')
  findMenus(@Query('category') category?: string) {
    return this.catalogService.findAllMenuItems(category);
  }

  @Get('recommendations')
  findRecommendations(@Query('category') category?: string) {
    return this.catalogService.findAllRecommendations(category);
  }

  @Get(':id/detail')
  findOneForGuest(@Param('id') id: string, @CurrentUser() user: any) {
    return this.catalogService.findOneForGuest(id, user.email);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.catalogService.findOne(id);
  }

  // Estate Manager routes
  @Get('admin/all')
  @Roles('estate_manager', 'owner')
  findAll(@Query('category') category?: CatalogCategory) {
    return this.catalogService.findAll(category);
  }

  @Post()
  @Roles('estate_manager')
  create(@Body() dto: CreateCatalogItemDto, @CurrentUser() user: any) {
    return this.catalogService.create(dto, user.auth0Id);
  }

  @Patch(':id')
  @Roles('estate_manager')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCatalogItemDto,
    @CurrentUser() user: any,
  ) {
    return this.catalogService.update(id, dto, user.auth0Id);
  }

  @Patch(':id/toggle-active')
  @Roles('estate_manager')
  toggleActive(@Param('id') id: string, @CurrentUser() user: any) {
    return this.catalogService.toggleActive(id, user.auth0Id);
  }

  @Delete(':id')
  @Roles('estate_manager')
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.catalogService.remove(id, user.auth0Id);
  }

  // Menu routes
  @Post('menus')
  @Roles('estate_manager')
  createMenuItem(@Body() data: any, @CurrentUser() user: any) {
    return this.catalogService.createMenuItem(data, user.auth0Id);
  }

  @Patch('menus/:id')
  @Roles('estate_manager')
  updateMenuItem(@Param('id') id: string, @Body() data: any) {
    return this.catalogService.updateMenuItem(id, data);
  }

  @Delete('menus/:id')
  @Roles('estate_manager')
  removeMenuItem(@Param('id') id: string) {
    return this.catalogService.removeMenuItem(id);
  }

  // Recommendations routes
  @Post('recommendations')
  @Roles('estate_manager')
  createRecommendation(@Body() data: any, @CurrentUser() user: any) {
    return this.catalogService.createRecommendation(data, user.auth0Id);
  }

  @Patch('recommendations/:id')
  @Roles('estate_manager')
  updateRecommendation(@Param('id') id: string, @Body() data: any) {
    return this.catalogService.updateRecommendation(id, data);
  }
}
