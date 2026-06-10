import { IsString, IsOptional } from 'class-validator';

export class CreateCrmNoteDto {
  @IsString()
  note!: string;
}

export class UpdateCrmNoteDto {
  @IsOptional()
  @IsString()
  note?: string;
}
