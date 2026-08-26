import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';

export class CreateExperienceCategoryDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  description?: string;

  /**
   * Null clears it, which is why the check is ValidateIf rather than
   * IsOptional alone — an absent field never reaches Prisma and the column
   * keeps whatever it had.
   */
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  glyph?: string | null;

  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
