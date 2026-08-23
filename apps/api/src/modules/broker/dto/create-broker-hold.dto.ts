import {
  IsDateString,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { MAX_PARTY_SIZE } from '../broker.types';

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

  /**
   * Checked for shape, never for existence. This is a trusted channel and the
   * estate telephones brokers anyway, so a confirmation loop would cost more
   * patience than it buys certainty — but catching `marisol@aurora` before it
   * becomes the only way to reach someone costs nothing.
   */
  @IsEmail({}, { message: 'That doesn’t look like an email address' })
  @MaxLength(160)
  brokerEmail!: string;

  /** Separate from the name so the person stays addressable. */
  @IsOptional()
  @IsString()
  @MaxLength(120)
  brokerAgency?: string;

  /**
   * Required: Lodgify asks for it and the estate cannot guess it. Bounded by
   * what the villa sleeps, so an impossible party is refused here rather than
   * discovered when rooms are being assigned.
   */
  @IsInt()
  @Min(1)
  @Max(MAX_PARTY_SIZE)
  guestCount!: number;

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
