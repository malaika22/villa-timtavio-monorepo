import {
  IsArray,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { MenuCategory } from '@prisma/client';

export class UpsertDailyMenuDto {
  @IsDateString()
  date!: string;

  @IsEnum(MenuCategory)
  mealType!: MenuCategory;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;

  /**
   * The whole line-up, in the order guests should read it. Authoritative —
   * a dish left out of this list is a dish taken off the menu.
   */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  menuItemIds?: string[];
}
