import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { MenuCategory, MenuCourse } from '@prisma/client';

/**
 * Menu writes used to take `any` and hand it straight to Prisma, so a bad
 * category came back as a 500 from the database rather than a 400 from us.
 */
export class CreateMenuItemDto {
  @IsString()
  @MaxLength(200)
  name!: string;

  @IsEnum(MenuCategory)
  category!: MenuCategory;

  /**
   * Which part of the meal this belongs to, and so which allowance it counts
   * against when a party composes a day. Omitted for snacks, beverages and
   * exclusives — those are ordered on demand rather than composed.
   */
  @IsOptional()
  @IsEnum(MenuCourse)
  course?: MenuCourse | null;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  photoUrl?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isVegetarian?: boolean;

  @IsOptional()
  @IsBoolean()
  isVegan?: boolean;

  @IsOptional()
  @IsBoolean()
  isGlutenFree?: boolean;

  @IsOptional()
  @IsBoolean()
  containsNuts?: boolean;

  @IsOptional()
  @IsBoolean()
  containsDairy?: boolean;

  @IsOptional()
  @IsBoolean()
  containsShellfish?: boolean;

  @IsOptional()
  @IsString()
  otherDietaryNotes?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  /**
   * False for a dish written for one service. It keeps its photo and dietary
   * flags but stays out of the library, so planning a Thursday doesn't
   * permanently enlarge the menu.
   */
  @IsOptional()
  @IsBoolean()
  isStanding?: boolean;
}
