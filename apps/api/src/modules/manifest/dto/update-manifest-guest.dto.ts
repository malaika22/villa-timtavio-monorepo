import { PartialType } from '@nestjs/mapped-types';
import { CreateManifestGuestDto } from './create-manifest-guest.dto';

export class UpdateManifestGuestDto extends PartialType(
  CreateManifestGuestDto,
) {}
