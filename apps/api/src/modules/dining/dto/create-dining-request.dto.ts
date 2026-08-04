import {
  IsString,
  IsOptional,
  IsInt,
  IsEnum,
  IsArray,
  IsDateString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DiningRequestKind, MenuCategory } from '@prisma/client';

export class CreateDiningRequestDto {
  @IsEnum(DiningRequestKind)
  kind!: DiningRequestKind;

  // ─── SITTING ───────────────────────────────────────────────
  @IsOptional()
  @IsEnum(MenuCategory)
  mealType?: MenuCategory;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsString()
  time?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  partySize?: number;

  @IsOptional()
  @IsString()
  allergies?: string;

  @IsOptional()
  @IsString()
  specialRequests?: string;

  // ─── ORDER ─────────────────────────────────────────────────
  @IsOptional()
  @IsArray()
  items?: { menuItemId: string; name: string; quantity: number }[];

  @IsOptional()
  @IsString()
  requestedFor?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  /**
   * The sitting an exclusive addition should arrive at, when the guest chose to
   * attach it rather than have it brought up. Ignored for included orders.
   */
  @IsOptional()
  @IsString()
  linkedSittingId?: string;
}
