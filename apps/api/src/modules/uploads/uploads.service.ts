import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { createHash } from 'crypto';

@Injectable()
export class UploadsService {
  // CLOUDINARY_URL = cloudinary://<apiKey>:<apiSecret>@<cloudName>
  private config() {
    const url = process.env.CLOUDINARY_URL;
    const match = url?.match(/^cloudinary:\/\/([^:]+):([^@]+)@(.+)$/);
    if (!match) {
      throw new InternalServerErrorException(
        'Image uploads are not configured. Set CLOUDINARY_URL on the API.',
      );
    }
    return { apiKey: match[1], apiSecret: match[2], cloudName: match[3] };
  }

  /**
   * Produce the parameters for a signed, direct (browser → Cloudinary) upload.
   * The API secret never leaves the server; the browser uploads the file with
   * the returned api_key + timestamp + signature. Cloudinary signs the
   * alphabetically-sorted params, appends the secret, then SHA-1 hashes them.
   */
  signUpload(folder: string) {
    const { apiKey, apiSecret, cloudName } = this.config();
    const timestamp = Math.floor(Date.now() / 1000);
    const toSign = `folder=${folder}&timestamp=${timestamp}`;
    const signature = createHash('sha1')
      .update(toSign + apiSecret)
      .digest('hex');
    return { cloudName, apiKey, timestamp, folder, signature };
  }
}
