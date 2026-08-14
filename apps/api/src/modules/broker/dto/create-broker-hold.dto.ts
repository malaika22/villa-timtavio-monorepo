import { IsDateString, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateBrokerHoldDto {
  /**
   * Typed on the page and kept in the broker's browser. Not authenticated —
   * with a single shared link it can't be. It exists so a hold arrives with a
   * name the estate can call back, rather than as an anonymous block.
   */
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  brokerName!: string;

  @IsDateString()
  checkIn!: string;

  @IsDateString()
  checkOut!: string;

  /** Anything the broker wants the estate to know — client name, occasion. */
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
