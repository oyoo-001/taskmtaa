import {
  CLOUDINARY_FOLDERS,
  buildThumbnailUrl,
  uploadBuffer,
} from '../config/cloudinary.js';
import { BadRequestException } from '../middleware/errorHandler.js';

/**
 * POST /api/v1/uploads/gig-images
 * Upload up to five gig gallery images to Cloudinary.
 *
 * Returns a delivery URL, a derived thumbnail URL and the public id for
 * each image. Thumbnails are Cloudinary URL transformations, not extra
 * stored files.
 */
export const uploadGigImages = async (req, res) => {
  const files = req.files || [];

  if (files.length === 0) {
    throw new BadRequestException('No images uploaded. Add at least one image.');
  }

  const images = [];

  for (const file of files) {
    const uploaded = await uploadBuffer(file.buffer, {
      folder: CLOUDINARY_FOLDERS.gigs,
      public_id: `gig-${req.user.id}-${Date.now()}-${Math.round(Math.random() * 1e9)}`,
      transformation: [
        { width: 1600, height: 1200, crop: 'limit' },
        { quality: 'auto', fetch_format: 'auto' },
      ],
    });

    images.push({
      url: uploaded.secure_url,
      thumbnail_url: buildThumbnailUrl(uploaded.secure_url),
      public_id: uploaded.public_id,
      width: uploaded.width,
      height: uploaded.height,
    });
  }

  res.status(201).json({
    success: true,
    data: {
      images,
      count: images.length,
    },
  });
};
