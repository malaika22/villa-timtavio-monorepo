import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { CreateExperienceCategoryDto } from './dto/create-experience-category.dto';
import { UpdateExperienceCategoryDto } from './dto/update-experience-category.dto';

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

@Injectable()
export class ExperienceCategoriesService {
  constructor(private prisma: PrismaService) {}

  async findAll(includeInactive = false) {
    // No default seeding — categories exist only if added manually or created
    // by a bulk sheet upload.
    return this.prisma.experienceCategory.findMany({
      where: includeInactive ? undefined : { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: {
        _count: { select: { catalogItems: true } },
      },
    });
  }

  async findOne(id: string) {
    const category = await this.prisma.experienceCategory.findUnique({
      where: { id },
      include: {
        _count: { select: { catalogItems: true } },
      },
    });
    if (!category) {
      throw new NotFoundException(`Experience category ${id} not found`);
    }
    return category;
  }

  async create(dto: CreateExperienceCategoryDto) {
    const slug = slugify(dto.slug ?? dto.name);
    const existing = await this.prisma.experienceCategory.findUnique({
      where: { slug },
    });
    if (existing) {
      throw new BadRequestException(`Category slug "${slug}" already exists`);
    }

    return this.prisma.experienceCategory.create({
      data: {
        name: dto.name,
        slug,
        description: dto.description,
        sortOrder: dto.sortOrder ?? 0,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async update(id: string, dto: UpdateExperienceCategoryDto) {
    await this.findOne(id);

    const slug = dto.slug ? slugify(dto.slug) : undefined;
    if (slug) {
      const existing = await this.prisma.experienceCategory.findFirst({
        where: { slug, NOT: { id } },
      });
      if (existing) {
        throw new BadRequestException(`Category slug "${slug}" already exists`);
      }
    }

    return this.prisma.experienceCategory.update({
      where: { id },
      data: {
        ...dto,
        ...(slug ? { slug } : {}),
      },
    });
  }

  async remove(id: string) {
    const category = await this.findOne(id);
    if (category._count.catalogItems > 0) {
      throw new BadRequestException(
        'Cannot delete a category that has experiences assigned',
      );
    }

    return this.prisma.experienceCategory.delete({ where: { id } });
  }
}
