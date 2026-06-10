import { IsInt, IsString, IsEnum, IsOptional } from 'class-validator';
import { RoomType } from '@prisma/client';
import { Type } from 'class-transformer';

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
  @Type(() => Number)
  @IsInt()
  floorLevel?: number;
}
