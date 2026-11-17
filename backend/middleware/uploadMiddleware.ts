import crypto from 'crypto';
import fs from 'fs';
import multer from 'multer';
import path from 'path';
import { env } from '../config/env';

if (!fs.existsSync(env.uploadsDir)) {
  fs.mkdirSync(env.uploadsDir, { recursive: true });
}

const ALLOWED_MIME_TYPES: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, env.uploadsDir);
  },
  filename: (_req, file, cb) => {
    const ext = ALLOWED_MIME_TYPES[file.mimetype] || path.extname(file.originalname).toLowerCase();
    const safeName = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
    cb(null, safeName);
  },
});

export const uploadImage = multer({
  storage,
  limits: {
    fileSize: env.uploadMaxSizeBytes,
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExts = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    if (!ALLOWED_MIME_TYPES[file.mimetype] || !allowedExts.includes(ext)) {
      cb(new Error('Only JPG, PNG, WEBP, and GIF image files are permitted.'));
      return;
    }
    cb(null, true);
  },
});
