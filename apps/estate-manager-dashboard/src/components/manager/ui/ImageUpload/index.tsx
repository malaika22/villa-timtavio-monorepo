'use client';

import { useRef, useState } from 'react';
import { Button } from '@repo/ui';
import { Upload } from 'lucide-react';
import { toast } from 'sonner';

import { uploadImage, type UploadFolder } from '@/lib/upload';

type Props = {
  folder: UploadFolder;
  onUploaded: (url: string) => void;
  label?: string;
  className?: string;
};

export function ImageUpload({
  folder,
  onUploaded,
  label = 'Upload image',
  className,
}: Props) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file.');
      return;
    }
    setUploading(true);
    try {
      const url = await uploadImage(file, folder);
      onUploaded(url);
      toast.success('Image uploaded');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
      />
      <Button
        type="button"
        variant="outline"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        className={className}
      >
        <Upload className="mr-2 size-4" />
        {uploading ? 'Uploading…' : label}
      </Button>
    </>
  );
}
