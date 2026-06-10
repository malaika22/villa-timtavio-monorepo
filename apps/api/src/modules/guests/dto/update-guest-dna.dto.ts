import {
  IsString,
  IsOptional,
  IsArray,
  IsEnum,
  IsDateString,
  IsNumber,
} from 'class-validator';
import { RoomType } from '@prisma/client';

export class UpdateGuestDnaDto {
  @IsOptional()
  @IsString()
  beveragePreferences?: string;

  @IsOptional()
  @IsString()
  winePreferences?: string;

  @IsOptional()
  @IsArray()
  dietaryRestrictions?: string[];

  @IsOptional()
  @IsString()
  allergies?: string;

  @IsOptional()
  @IsArray()
  favouriteExperiences?: string[];

  @IsOptional()
  @IsString()
  preferredTimes?: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsOptional()
  @IsString()
  specialOccasions?: string;

  @IsOptional()
  @IsEnum(RoomType)
  preferredRoomType?: RoomType;

  @IsOptional()
  @IsString()
  pillarPreferences?: string;
}
