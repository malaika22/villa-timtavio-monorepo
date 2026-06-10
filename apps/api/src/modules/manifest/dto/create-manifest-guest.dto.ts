import {
  IsString,
  IsEmail,
  IsOptional,
  IsInt,
  IsArray,
  IsDateString,
  Min,
  Max,
} from 'class-validator';

export class CreateManifestGuestDto {
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
  dateOfBirth?: string;

  @IsOptional()
  @IsString()
  relationship?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(6)
  roomNumber?: number;

  @IsOptional()
  @IsArray()
  dietaryRestrictions?: string[];

  @IsOptional()
  @IsString()
  allergies?: string;

  @IsOptional()
  @IsString()
  beveragePreferences?: string;

  @IsOptional()
  @IsString()
  specialNotes?: string;
}
