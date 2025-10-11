import { supabase } from '../lib/supabase';

export interface UploadImageResult {
  url: string;
  path: string;
  error?: string;
}

export const uploadImage = async (
  file: File,
  folder: 'before' | 'after'
): Promise<UploadImageResult> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    const { error: uploadError, data } = await supabase.storage
      .from('gallery-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      return { url: '', path: '', error: uploadError.message };
    }

    const { data: { publicUrl } } = supabase.storage
      .from('gallery-images')
      .getPublicUrl(filePath);

    return { url: publicUrl, path: filePath };
  } catch (error) {
    return { url: '', path: '', error: 'Failed to upload image' };
  }
};

export const deleteImage = async (path: string): Promise<boolean> => {
  try {
    const { error } = await supabase.storage
      .from('gallery-images')
      .remove([path]);

    return !error;
  } catch (error) {
    return false;
  }
};

export const validateImageFile = (file: File): string | null => {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const maxSize = 5 * 1024 * 1024;

  if (!validTypes.includes(file.type)) {
    return 'Please upload a valid image file (JPEG, PNG, or WebP)';
  }

  if (file.size > maxSize) {
    return 'Image size must be less than 5MB';
  }

  return null;
};

export const compressImage = async (file: File, maxWidth = 1920, maxHeight = 1080): Promise<File> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          file.type,
          0.85
        );
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};
