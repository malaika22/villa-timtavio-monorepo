import {
  IsString,
  IsEnum,
  IsBoolean,
  IsOptional,
  IsInt,
  IsArray,
  IsNumber,
} from 'class-validator';
import { CatalogCategory } from '@prisma/client';

export class CreateCatalogItemDto {
  @IsString()
  name!: string;

  @IsEnum(CatalogCategory)
  category!: CatalogCategory;

  @IsString()
  description!: string;

  @IsOptional()
  @IsString()
  shortDescription?: string;

  @IsOptional()
  @IsBoolean()
  isIncluded?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsInt()
  durationMinutes?: number;

  @IsOptional()
  @IsString()
  durationLabel?: string;

  @IsOptional()
  @IsArray()
  photoUrls?: string[];

  @IsOptional()
  @IsString()
  primaryPhotoUrl?: string;

  @IsOptional()
  @IsBoolean()
  isMultiDay?: boolean;

  @IsOptional()
  @IsInt()
  multiDayDuration?: number;

  @IsOptional()
  @IsArray()
  availableTimeSlots?: string[];

  @IsOptional()
  @IsInt()
  maxGuestCount?: number;

  @IsOptional()
  @IsInt()
  setupLeadTimeMinutes?: number;

  @IsOptional()
  @IsString()
  vendorId?: string;

  @IsOptional()
  @IsString()
  experienceCategoryId?: string;

  /** Estimated rate — the single estimate, or the low end when priceMax is set. */
  @IsOptional()
  @IsNumber()
  basePrice?: number;

  /** High end of an estimate range. Omit for a single estimate. */
  @IsOptional()
  @IsNumber()
  priceMax?: number;

  @IsOptional()
  @IsString()
  priceUnitId?: string;

  @IsOptional()
  @IsString()
  breezeWayTeamId?: string;

  @IsOptional()
  @IsString()
  breezeWayTemplateId?: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @IsArray()
  included?: string[];

  @IsOptional()
  @IsString()
  hostName?: string;

  @IsOptional()
  @IsString()
  hostTitle?: string;

  @IsOptional()
  @IsString()
  hostAvatarUrl?: string;

  @IsOptional()
  @IsString()
  hostReviewNote?: string;
}
