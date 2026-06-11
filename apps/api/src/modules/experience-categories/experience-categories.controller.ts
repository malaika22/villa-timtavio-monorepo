import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import { Roles } from '../auth/decorators/roles.decorator';
import { CreateExperienceCategoryDto } from './dto/create-experience-category.dto';
import { UpdateExperienceCategoryDto } from './dto/update-experience-category.dto';
import { ExperienceCategoriesService } from './experience-categories.service';

@Controller('api/v1/experience-categories')
export class ExperienceCategoriesController {
  constructor(private categoriesService: ExperienceCategoriesService) {}

  @Get()
  @Roles('estate_manager', 'owner')
  findAll(@Query('includeInactive') includeInactive?: string) {
    return this.categoriesService.findAll(includeInactive === 'true');
  }

  @Get(':id')
  @Roles('estate_manager', 'owner')
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(id);
  }

  @Post()
  @Roles('estate_manager', 'owner')
  create(@Body() dto: CreateExperienceCategoryDto) {
    return this.categoriesService.create(dto);
  }

  @Patch(':id')
  @Roles('estate_manager', 'owner')
  update(@Param('id') id: string, @Body() dto: UpdateExperienceCategoryDto) {
    return this.categoriesService.update(id, dto);
  }

  @Delete(':id')
  @Roles('estate_manager', 'owner')
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }
}
