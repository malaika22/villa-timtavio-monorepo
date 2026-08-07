import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { MenuCategory } from '@prisma/client';

export class UpsertMenuSelectionDto {
  @IsDateString()
  date!: string;

  @IsEnum(MenuCategory)
  mealType!: MenuCategory;

  /**
   * The whole meal, in reading order. Authoritative — a dish left out of this
   * list is a dish taken off, so the composer never needs a separate remove
   * call and a half-applied edit can't leave the day in a state nobody chose.
   *
   * The cap is a guard against a malformed payload, not the real limit: the
   * per-course allowances are checked against the estate's rules.
   */
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(40)
  menuItemIds!: string[];

  /** The party's line to the kitchen, carried onto the run sheet verbatim. */
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
