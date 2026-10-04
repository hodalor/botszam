import type { UploadApiResponse } from 'cloudinary';
import { cloudinary, isCloudinaryConfigured } from '../config/cloudinary';
import { AppError } from '../utils/AppError';

const PRODUCT_FOLDER = 'botszam/products';

export interface StoredImage {
  url: string;
  publicId: string;
}

function assertConfigured() {
  if (!isCloudinaryConfigured) {
    throw new AppError('Image uploads are not configured', 503, 'UPLOADS_NOT_CONFIGURED');
  }
}

function mapCloudinaryError(error: unknown): never {
  const message =
    typeof error === 'object' && error && 'message' in error
      ? String((error as { message: unknown }).message)
      : 'Cloudinary upload failed';

  if (/invalid cloud_name/i.test(message)) {
    throw AppError.badRequest(
      'Cloudinary cloud_name is wrong. Copy the exact “Cloud name” from Cloudinary → Settings → API Keys into CLOUDINARY_CLOUD_NAME, then restart the API.',
      'CLOUDINARY_CLOUD_NAME',
    );
  }
  if (/invalid api_key|must supply api_key|unauthorized|401/i.test(message)) {
    throw AppError.badRequest(
      'Cloudinary API key/secret rejected. Check CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET, then restart the API.',
      'CLOUDINARY_AUTH',
    );
  }
  throw new AppError(message, 502, 'CLOUDINARY_UPLOAD_FAILED');
}

export async function uploadImageBuffer(buffer: Buffer): Promise<StoredImage> {
  assertConfigured();
  try {
    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: PRODUCT_FOLDER, resource_type: 'image' },
        (error, response) => {
          if (error || !response) return reject(error ?? new Error('Empty Cloudinary response'));
          resolve(response);
        },
      );
      stream.end(buffer);
    });
    return { url: result.secure_url, publicId: result.public_id };
  } catch (error) {
    mapCloudinaryError(error);
  }
}

export async function deleteImage(publicId: string): Promise<void> {
  assertConfigured();
  await cloudinary.uploader.destroy(publicId);
}
