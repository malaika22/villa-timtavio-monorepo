import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { CatalogCategory, VendorStatus } from '@prisma/client';

export class CreateVendorDto {
  @IsString()
  name!: string;

  @IsEnum(CatalogCategory)
  category!: CatalogCategory;

  @IsString()
  role!: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  photoUrl?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEnum(VendorStatus)
  status?: VendorStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}
