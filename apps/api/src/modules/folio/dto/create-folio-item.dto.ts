import { IsString, IsNumber, IsEnum, IsOptional, IsInt } from 'class-validator';
import { FolioItemType } from '@prisma/client';

export class CreateFolioItemDto {
  @IsEnum(FolioItemType)
  type!: FolioItemType;

  @IsString()
  description!: string;

  @IsNumber()
  amount!: number;

  @IsOptional()
  @IsInt()
  quantity?: number;

  @IsOptional()
  @IsString()
  attributedToEmail?: string;

  @IsOptional()
  @IsString()
  attributedToName?: string;

  @IsOptional()
  @IsString()
  staffNote?: string;
}
