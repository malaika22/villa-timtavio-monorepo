import {
  IsInt,
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsArray,
  ValidateNested,
  Min,
} from 'class-validator';
import { RoomType } from '@prisma/client';
import { Type } from 'class-transformer';

const BED_TYPES = [
  'king',
  'queen',
  'double',
  'twin',
  'single',
  'bunk',
  'sofa',
] as const;

const ROOM_AMENITIES = [
  'balcony',
  'ac',
  'pool_view',
  'ocean_view',
  'walk_in_closet',
  'workspace',
  'smart_tv',
  'minibar',
] as const;

export class BedDto {
  @IsEnum(BED_TYPES)
  type!: (typeof BED_TYPES)[number];

  @Type(() => Number)
  @IsInt()
  @Min(1)
  count!: number;
}

export class CreateRoomDto {
  @Type(() => Number)
  @IsInt()
  number!: number;

  @IsString()
  name!: string;

  @IsEnum(RoomType)
  type!: RoomType;

  @Type(() => Number)
  @IsInt()
  capacity!: number;

  @IsString()
  bedConfig!: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BedDto)
  beds?: BedDto[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  bathrooms?: number;

  @IsOptional()
  @IsBoolean()
  ensuite?: boolean;

  @IsOptional()
  @IsArray()
  @IsEnum(ROOM_AMENITIES, { each: true })
  amenities?: (typeof ROOM_AMENITIES)[number][];

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  floorLevel?: number;
}
