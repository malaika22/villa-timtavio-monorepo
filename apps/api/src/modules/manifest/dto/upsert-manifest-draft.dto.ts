import { IsObject, IsOptional, IsString } from 'class-validator';

export class UpsertManifestDraftDto {
  @IsObject()
  data!: Record<string, unknown>;

  @IsOptional()
  @IsString()
  guestId?: string;
}
