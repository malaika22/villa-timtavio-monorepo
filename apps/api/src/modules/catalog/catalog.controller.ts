import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CatalogService } from './catalog.service';
import { CreateCatalogItemDto } from './dto/create-catalog-item.dto';
import { UpdateCatalogItemDto } from './dto/update-catalog-item.dto';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
import { CatalogCategory } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('api/v1/catalog')
export class CatalogController {
  constructor(private catalogService: CatalogService) {}

  // ─── Guest PWA routes ────────────────────────────────────────────────────

  @Get()
  findActive(@Query('category') category?: CatalogCategory) {
    return this.catalogService.findAllActive(category);
  }

  @Get('included')
  findIncluded() {
    return this.catalogService.findIncluded();
  }

  // Price units are a lookup, so the EM form and the guest surfaces read the
  // same list rather than hard-coding per person / per group / per event.
  @Get('price-units')
  findPriceUnits() {
    return this.catalogService.findPriceUnits();
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

  // ─── Estate Manager: view all ────────────────────────────────────────────

  @Get('admin/all')
  @Roles('estate_manager', 'owner')
  findAll(@Query('category') category?: CatalogCategory) {
    return this.catalogService.findAll(category);
  }

  // ─── Estate Manager: individual add ─────────────────────────────────────

  @Post()
  @Roles('estate_manager')
  create(@Body() dto: CreateCatalogItemDto, @CurrentUser() user: any) {
    return this.catalogService.create(dto, user.auth0Id);
  }

  // ─── Estate Manager: CSV bulk upload ────────────────────────────────────

  @Post('import/csv')
  @Roles('estate_manager')
  @UseInterceptors(FileInterceptor('file'))
  async importCsv(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: any,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');

    const allowedMimeTypes = ['text/csv', 'application/vnd.ms-excel'];
    if (
      !allowedMimeTypes.includes(file.mimetype) &&
      !file.originalname.endsWith('.csv')
    ) {
      throw new BadRequestException('File must be a CSV');
    }

    const csvContent = file.buffer.toString('utf8');
    return this.catalogService.importFromCsv(csvContent, user.auth0Id);
  }

  // ─── Estate Manager: update/delete ──────────────────────────────────────

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

  // ─── Menu item routes ────────────────────────────────────────────────────

  @Post('menus')
  @Roles('estate_manager')
  createMenuItem(
    @Body() data: CreateMenuItemDto,
    @CurrentUser() user: any,
  ) {
    return this.catalogService.createMenuItem(data, user.auth0Id);
  }

  @Patch('menus/:id')
  @Roles('estate_manager')
  updateMenuItem(
    @Param('id') id: string,
    @Body() data: UpdateMenuItemDto,
  ) {
    return this.catalogService.updateMenuItem(id, data);
  }

  @Delete('menus/:id')
  @Roles('estate_manager')
  removeMenuItem(@Param('id') id: string) {
    return this.catalogService.removeMenuItem(id);
  }

  // ─── Recommendation routes ────────────────────────────────────────────────

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
