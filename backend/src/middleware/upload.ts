import multer from 'multer';
import { AppError } from '../utils/AppError';

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 8 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.has(file.mimetype)) return cb(null, true);
    cb(AppError.badRequest('Only JPEG, PNG or WebP images are allowed', 'INVALID_FILE_TYPE'));
  },
});
