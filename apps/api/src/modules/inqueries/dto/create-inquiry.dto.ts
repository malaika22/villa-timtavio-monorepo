import {
  IsString,
  IsEmail,
  IsOptional,
  IsInt,
  IsEnum,
  IsDateString,
  Min,
  Max,
} from 'class-validator';
import { PurposeOfStay } from '@prisma/client';

export class CreateInquiryDto {
  @IsString()
  firstName!: string;

  @IsString()
  lastName!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsDateString()
  preferredFrom?: string;

  @IsOptional()
  @IsDateString()
  preferredTo?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(16)
  guestCount?: number;

  @IsOptional()
  @IsEnum(PurposeOfStay)
  purposeOfStay?: PurposeOfStay;

  @IsOptional()
  @IsString()
  socialHandle?: string;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsString()
  message?: string;
}

export class ReviewInquiryDto {
  @IsOptional()
  @IsString()
  notes?: string;
}

export class DeclineInquiryDto {
  @IsOptional()
  @IsString()
  declineReason?: string;
}
