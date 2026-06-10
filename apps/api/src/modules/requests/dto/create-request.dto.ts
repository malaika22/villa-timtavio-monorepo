import { IsString, IsDateString, IsInt, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateRequestDto {
  @IsString()
  catalogItemId!: string;

  @IsDateString()
  preferredDate!: string;

  @IsString()
  preferredTime!: string;

  @Type(() => Number)
  @IsInt()
  guestCount!: number;

  @IsOptional()
  @IsString()
  specialRequests!: string;

  @IsOptional()
  @IsDateString()
  returnDate?: string;

  @IsOptional()
  @IsString()
  transportPreference?: string;
}

export class ConfirmRequestDto {
  @IsOptional()
  @IsDateString()
  confirmedDate?: string;

  @IsOptional()
  @IsString()
  confirmedTime?: string;

  @IsOptional()
  @IsString()
  emNotes?: string;
}

export class DeclineRequestDto {
  @IsOptional()
  @IsString()
  declineReason?: string;
}
