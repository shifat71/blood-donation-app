import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload an image to Cloudinary
 * @param file - The file to upload (Buffer or base64 string)
 * @param folder - The folder name in Cloudinary (e.g., 'student-id-cards')
 * @returns The secure URL of the uploaded image
 */
export async function uploadToCloudinary(
  file: Buffer | string,
  folder: string = 'blood-donation-app'
): Promise<string> {
  try {
    // Convert Buffer to base64 if needed
    const fileStr = Buffer.isBuffer(file) 
      ? `data:image/jpeg;base64,${file.toString('base64')}`
      : file;

    const result = await cloudinary.uploader.upload(fileStr, {
      folder: folder,
      resource_type: 'image',
      transformation: [
        { width: 1000, height: 1000, crop: 'limit' }, // Limit max size
        { quality: 'auto' }, // Auto optimize quality
        { fetch_format: 'auto' }, // Auto format (WebP if supported)
      ],
    });

    return result.secure_url;
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw new Error('Failed to upload image');
  }
}

/**
 * Delete an image from Cloudinary
 * @param publicId - The public ID of the image to delete
 * @returns Boolean indicating success
 */
export async function deleteFromCloudinary(publicId: string): Promise<boolean> {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === 'ok';
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    return false;
  }
}

/**
 * Extract public ID from Cloudinary URL
 * @param url - The Cloudinary URL
 * @returns The public ID
 */
export function getPublicIdFromUrl(url: string): string {
  const parts = url.split('/');
  const filename = parts[parts.length - 1];
  return filename.split('.')[0];
}

export default cloudinary;
