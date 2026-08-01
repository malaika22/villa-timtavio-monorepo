import { Body, Controller, Post } from '@nestjs/common';
import { UploadsService } from './uploads.service';
import { Roles } from '../auth/decorators/roles.decorator';

// Whitelist of destination folders so the client can't write anywhere.
const FOLDERS: Record<string, string> = {
  rooms: 'villa-timtavio/rooms',
  experiences: 'villa-timtavio/experiences',
  menu: 'villa-timtavio/menu',
};

@Controller('api/v1/uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  /** Returns signed params so the EM can upload an image straight to Cloudinary. */
  @Post('sign')
  @Roles('estate_manager')
  sign(@Body() body: { folder?: string }) {
    const folder = FOLDERS[body?.folder ?? ''] ?? 'villa-timtavio/misc';
    return this.uploadsService.signUpload(folder);
  }
}
