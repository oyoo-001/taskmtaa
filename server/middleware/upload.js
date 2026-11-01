import multer from 'multer';
import path from 'path';
import { BadRequestException } from './errorHandler.js';

const ALLOWED_IMAGE_TYPES = /jpeg|jpg|png|gif|webp/;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB per image
export const MAX_GIG_IMAGES = 5;

const fileFilter = (req, file, cb) => {
  const extname = ALLOWED_IMAGE_TYPES.test(
    path.extname(file.originalname || '').toLowerCase()
  );
  const mimetype = ALLOWED_IMAGE_TYPES.test(file.mimetype || '');

  if (extname && mimetype) {
    return cb(null, true);
  }

  return cb(
    new BadRequestException(
      'Only image files are allowed (jpeg, jpg, png, gif, webp)'
    )
  );
};

// Files stay in memory and are streamed straight to Cloudinary, so no
// uploads ever touch the server's disk.
const memoryStorage = multer.memoryStorage();

export const uploadAvatar = multer({
  storage: memoryStorage,
  limits: { fileSize: MAX_FILE_SIZE, files: 1 },
  fileFilter,
}).single('avatar');

export const uploadGigImages = multer({
  storage: memoryStorage,
  limits: { fileSize: MAX_FILE_SIZE, files: MAX_GIG_IMAGES },
  fileFilter,
}).array('images', MAX_GIG_IMAGES);
