import { IsOptional, IsString } from 'class-validator';

export class UpsertManifestDraftDto {
  data!: Record<string, unknown>;

  @IsOptional()
  @IsString()
  guestId?: string;
}
