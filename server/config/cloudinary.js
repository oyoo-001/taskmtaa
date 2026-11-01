import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import { HttpException } from '../middleware/errorHandler.js';

dotenv.config();

const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

export const isCloudinaryConfigured = Boolean(cloudName && apiKey && apiSecret);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
    timeout: 60000, // 60 seconds timeout
  });
}

const ROOT_FOLDER = process.env.CLOUDINARY_FOLDER || 'taskmtaa';

export const CLOUDINARY_FOLDERS = {
  avatars: `${ROOT_FOLDER}/avatars`,
  gigs: `${ROOT_FOLDER}/gigs`,
};

const assertConfigured = () => {
  if (!isCloudinaryConfigured) {
    throw new HttpException(
      503,
      'Image storage is not configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET to the server .env file.'
    );
  }
};

/**
 * Upload an in-memory file buffer to Cloudinary.
 * Resolves with the Cloudinary upload result (secure_url, public_id, etc.).
 */
export const uploadBuffer = (buffer, options = {}) => {
  assertConfigured();

  return new Promise((resolve, reject) => {
    // Set a timeout for the upload operation
    const timeout = setTimeout(() => {
      reject(new HttpException(408, 'Upload timeout - please try again with a smaller image or check your connection'));
    }, 60000); // 60 seconds

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'image',
        timeout: 60000,
        ...options,
      },
      (error, result) => {
        clearTimeout(timeout);
        
        if (error) {
          console.error('Cloudinary upload error:', error);
          
          // Provide more specific error messages
          let errorMessage = 'Image upload failed';
          let statusCode = 502;
          
          if (error.message?.includes('timeout') || error.message?.includes('ETIMEDOUT')) {
            errorMessage = 'Upload timeout - please try again with a smaller image';
            statusCode = 408;
          } else if (error.message?.includes('Invalid API Key')) {
            errorMessage = 'Cloud storage configuration error';
            statusCode = 500;
          } else if (error.http_code) {
            statusCode = error.http_code;
            errorMessage = error.message || errorMessage;
          }
          
          const wrapped = new HttpException(statusCode, errorMessage);
          return reject(wrapped);
        }
        return resolve(result);
      }
    );

    uploadStream.end(buffer);
  });
};

/**
 * Build a Cloudinary thumbnail URL from a full delivery URL.
 * Cloudinary derives thumbnails through URL transformations, so we never
 * store a second file.
 */
export const buildThumbnailUrl = (
  url,
  { width = 640, height = 420, crop = 'fill' } = {}
) => {
  if (!url || typeof url !== 'string') return null;
  if (!url.includes('/upload/')) return url;

  const transformation = `c_${crop},w_${width},h_${height},q_auto,f_auto`;
  return url.replace('/upload/', `/upload/${transformation}/`);
};

/**
 * Extract the Cloudinary public id from a delivery URL.
 * Handles optional transformations and version segments.
 */
export const getPublicIdFromUrl = (url) => {
  if (!url || typeof url !== 'string') return null;

  const clean = url.split('?')[0].split('#')[0];
  const match = clean.match(/\/upload\/(.+)$/);
  if (!match) return null;

  let assetPath = match[1];
  const versionMatch = assetPath.match(/(?:^|\/)v\d+\/(.+)$/);

  if (versionMatch) {
    assetPath = versionMatch[1];
  } else {
    // No version segment: drop a leading transformation segment if present.
    const segments = assetPath.split('/');
    if (segments.length > 1 && segments[0].includes('_') && !segments[0].includes('.')) {
      segments.shift();
    }
    assetPath = segments.join('/');
  }

  return assetPath.replace(/\.[a-zA-Z0-9]+$/, '');
};

/**
 * Best-effort deletion of a Cloudinary asset. Never throws so database
 * updates are not blocked by a failed cleanup.
 */
export const deleteImage = async (publicId) => {
  if (!publicId || !isCloudinaryConfigured) return false;

  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
    return true;
  } catch (error) {
    console.warn(`Could not delete Cloudinary asset ${publicId}:`, error.message);
    return false;
  }
};

/**
 * Delete several assets, accepting public ids or delivery URLs.
 */
export const deleteImages = async (values = []) => {
  const publicIds = [...new Set(
    values
      .map((value) => (value?.startsWith('http') ? getPublicIdFromUrl(value) : value))
      .filter(Boolean)
  )];

  await Promise.all(publicIds.map((publicId) => deleteImage(publicId)));
  return publicIds.length;
};

export default cloudinary;
