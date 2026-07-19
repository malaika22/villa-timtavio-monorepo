import { api } from '@/lib/api';

type SignResponse = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  signature: string;
};

export type UploadFolder = 'rooms' | 'experiences';

/**
 * Upload an image via a signed, direct browser → Cloudinary request. Our API
 * signs the params (secret stays server-side); the browser posts the file.
 * Returns the Cloudinary secure URL.
 */
export async function uploadImage(
  file: File,
  folder: UploadFolder,
): Promise<string> {
  const sign = await api.post<SignResponse>('/api/v1/uploads/sign', { folder });

  const form = new FormData();
  form.append('file', file);
  form.append('api_key', sign.apiKey);
  form.append('timestamp', String(sign.timestamp));
  form.append('signature', sign.signature);
  form.append('folder', sign.folder);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${sign.cloudName}/image/upload`,
    { method: 'POST', body: form },
  );
  if (!res.ok) {
    throw new Error('Image upload failed. Please try again.');
  }
  const data = (await res.json()) as { secure_url?: string };
  if (!data.secure_url) throw new Error('Upload succeeded but returned no URL.');
  return data.secure_url;
}
