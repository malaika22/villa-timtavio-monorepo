import { IsDateString, IsInt, IsOptional, Max, Min } from 'class-validator';

export class CopyDailyMenuDto {
  /** First day of the stretch being copied. */
  @IsDateString()
  fromStart!: string;

  /** First day it lands on. */
  @IsDateString()
  toStart!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(31)
  days?: number;
}
