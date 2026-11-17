import crypto from 'crypto';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

function resolveJwtSecret(): string {
  if (process.env.JWT_SECRET && process.env.JWT_SECRET !== 'replace_with_a_strong_random_secret_before_production') {
    return process.env.JWT_SECRET;
  }

  // Generate and persist a local cryptographic secret for development if JWT_SECRET is not set
  const secretFile = path.resolve(process.cwd(), 'database', '.jwt_secret');
  const dir = path.dirname(secretFile);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (fs.existsSync(secretFile)) {
    const existing = fs.readFileSync(secretFile, 'utf8').trim();
    if (existing.length >= 32) {
      return existing;
    }
  }
  const generated = crypto.randomBytes(48).toString('hex');
  fs.writeFileSync(secretFile, generated, { mode: 0o600 });
  return generated;
}

export const env = {
  port: Number(process.env.PORT || 3000),
  nodeEnv: process.argv.includes('--prod') ? 'production' : (process.env.NODE_ENV || 'development'),
  appUrl: process.env.APP_URL || 'http://localhost:3000',
  jwtSecret: resolveJwtSecret(),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  sqliteDbPath: path.resolve(process.cwd(), process.env.SQLITE_DB_PATH || './database/casid_pharma.db'),
  initialAdminEmail: (process.env.INITIAL_ADMIN_EMAIL || 'shaheed@gmail.com').toLowerCase().trim(),
  uploadMaxSizeBytes: Number(process.env.UPLOAD_MAX_SIZE_MB || 5) * 1024 * 1024,
  uploadsDir: path.resolve(process.cwd(), 'backend', 'uploads'),
};
