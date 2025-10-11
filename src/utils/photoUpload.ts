import { supabase } from '../lib/supabase';
import { PhotoType } from '../types';

export interface UploadPhotoParams {
  bookingId: string;
  photoType: PhotoType;
  file: File;
  roomArea?: string;
  uploadedBy: string;
}

export const uploadBookingPhoto = async ({
  bookingId,
  photoType,
  file,
  roomArea,
  uploadedBy,
}: UploadPhotoParams): Promise<{ success: boolean; url?: string; error?: string }> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${bookingId}/${photoType}-${Date.now()}.${fileExt}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('booking-photos')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Error uploading photo:', uploadError);
      return { success: false, error: uploadError.message };
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from('booking-photos').getPublicUrl(fileName);

    const { error: dbError } = await supabase.from('booking_photos').insert([
      {
        booking_id: bookingId,
        photo_type: photoType,
        photo_url: publicUrl,
        room_area: roomArea,
        uploaded_by: uploadedBy,
      },
    ]);

    if (dbError) {
      console.error('Error saving photo record:', dbError);
      return { success: false, error: dbError.message };
    }

    return { success: true, url: publicUrl };
  } catch (error) {
    console.error('Error in photo upload:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

export const getBookingPhotos = async (bookingId: string) => {
  const { data, error } = await supabase
    .from('booking_photos')
    .select('*')
    .eq('booking_id', bookingId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching booking photos:', error);
    return [];
  }

  return data || [];
};

export const deleteBookingPhoto = async (photoId: string): Promise<boolean> => {
  try {
    const { data: photo } = await supabase
      .from('booking_photos')
      .select('photo_url')
      .eq('id', photoId)
      .single();

    if (!photo) return false;

    const fileName = photo.photo_url.split('/').pop();
    if (fileName) {
      await supabase.storage.from('booking-photos').remove([fileName]);
    }

    const { error } = await supabase.from('booking_photos').delete().eq('id', photoId);

    if (error) {
      console.error('Error deleting photo:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in photo deletion:', error);
    return false;
  }
};

export const validateImageFile = (file: File): { valid: boolean; error?: string } => {
  const maxSize = 10 * 1024 * 1024;
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Only JPEG, PNG, and WebP images are allowed.',
    };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'File size too large. Maximum size is 10MB.',
    };
  }

  return { valid: true };
};

export const compressImage = async (file: File, maxWidth = 1920): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          'image/jpeg',
          0.85
        );
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
};
