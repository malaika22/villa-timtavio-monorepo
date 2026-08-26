import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  ValidateIf,
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

  /**
   * Null clears it. `@IsOptional` alone would not: it skips validation for
   * undefined and null both, but an *absent* field is dropped by
   * JSON.stringify and never reaches Prisma, so the column keeps whatever it
   * had. Removing the last photo in the dashboard looked like it worked and
   * the cover image came back on the next load. Null is the difference
   * between "I'm not saying" and "there isn't one".
   */
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  primaryPhotoUrl?: string | null;

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

  /**
   * Whether the estate's own staff prepare anything for this.
   *
   * Off means no Breezeway task, and therefore no READY — nothing was
   * prepared, so there is nothing to report ready.
   */
  @IsOptional()
  @IsBoolean()
  needsSetupTask?: boolean;

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
