import fs from 'fs';
import path from 'path';
import type { Response } from 'express';
import { getDb } from '../config/db';
import { env } from '../config/env';
import type { AuthenticatedRequest } from '../middleware/authMiddleware';
import { extractClientIp, logAudit } from '../services/auditService';
import { sanitizeText } from '../services/sanitizeService';

function countMediaReferences(url: string): number {
  const db = getDb();
  const prodCount = (db.prepare('SELECT COUNT(*) as c FROM products WHERE image_url = ?').get(url) as { c: number }).c;
  const catCount = (db.prepare('SELECT COUNT(*) as c FROM categories WHERE image_url = ?').get(url) as { c: number }).c;
  const newsCount = (db.prepare('SELECT COUNT(*) as c FROM news WHERE image_url = ?').get(url) as { c: number }).c;
  const pageCount = (db.prepare('SELECT COUNT(*) as c FROM pages WHERE hero_image_url = ?').get(url) as { c: number }).c;
  return prodCount + catCount + newsCount + pageCount;
}

export function listMedia(_req: AuthenticatedRequest, res: Response): void {
  const db = getDb();
  const rows = db
    .prepare(`
      SELECT m.*, u.name as uploaded_by_name
      FROM media m
      LEFT JOIN users u ON m.uploaded_by = u.id
      ORDER BY m.created_at DESC, m.id DESC
    `)
    .all() as Array<Record<string, unknown>>;

  const enriched = rows.map((row) => ({
    ...row,
    reference_count: countMediaReferences(String(row.url)),
  }));

  res.json({ media: enriched });
}

export function uploadMedia(req: AuthenticatedRequest, res: Response): void {
  if (!req.file) {
    res.status(400).json({ error: 'Please select a valid image file (JPG, PNG, WEBP, or GIF).' });
    return;
  }

  const db = getDb();
  const ip = extractClientIp(req);
  const altText = sanitizeText(req.body?.alt_text || req.file.originalname, 240);
  const url = `/uploads/${req.file.filename}`;

  const info = db
    .prepare(`
      INSERT INTO media (filename, original_name, mime_type, file_size, url, alt_text, uploaded_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      req.file.filename,
      sanitizeText(req.file.originalname, 200),
      req.file.mimetype,
      req.file.size,
      url,
      altText,
      req.user?.id ?? null
    );

  const id = Number(info.lastInsertRowid);
  const created = db.prepare('SELECT * FROM media WHERE id = ?').get(id);

  logAudit({
    userId: req.user?.id,
    userEmail: req.user?.email,
    action: 'MEDIA_UPLOADED',
    entityType: 'media',
    entityId: id,
    details: `Uploaded media "${req.file.originalname}" (${req.file.size} bytes) as ${url}.`,
    ipAddress: ip,
  });

  res.status(201).json({ media: created });
}

export function replaceMedia(req: AuthenticatedRequest, res: Response): void {
  const id = Number(req.params.id);
  const db = getDb();
  const ip = extractClientIp(req);

  const existing = db.prepare('SELECT * FROM media WHERE id = ?').get(id) as
    | { id: number; filename: string; url: string; alt_text: string }
    | undefined;

  if (!existing) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(404).json({ error: 'Media asset not found.' });
    return;
  }

  if (!req.file) {
    res.status(400).json({ error: 'Replacement image file is required.' });
    return;
  }

  const newUrl = `/uploads/${req.file.filename}`;
  const altText = sanitizeText(req.body?.alt_text || existing.alt_text, 240);

  const replaceTx = db.transaction(() => {
    db.prepare(`
      UPDATE media SET
        filename = ?, original_name = ?, mime_type = ?, file_size = ?,
        url = ?, alt_text = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(req.file!.filename, sanitizeText(req.file!.originalname, 200), req.file!.mimetype, req.file!.size, newUrl, altText, id);

    // Propagate replaced image URL across referencing tables
    db.prepare('UPDATE products SET image_url = ? WHERE image_url = ?').run(newUrl, existing.url);
    db.prepare('UPDATE categories SET image_url = ? WHERE image_url = ?').run(newUrl, existing.url);
    db.prepare('UPDATE news SET image_url = ? WHERE image_url = ?').run(newUrl, existing.url);
    db.prepare('UPDATE pages SET hero_image_url = ? WHERE hero_image_url = ?').run(newUrl, existing.url);
  });

  replaceTx();

  // Remove old physical file only if it was in backend/uploads
  if (existing.url.startsWith('/uploads/')) {
    const oldPath = path.join(env.uploadsDir, path.basename(existing.url));
    if (fs.existsSync(oldPath)) {
      fs.unlinkSync(oldPath);
    }
  }

  const updated = db.prepare('SELECT * FROM media WHERE id = ?').get(id);

  logAudit({
    userId: req.user?.id,
    userEmail: req.user?.email,
    action: 'MEDIA_REPLACED',
    entityType: 'media',
    entityId: id,
    details: `Replaced media #${id} (${existing.url} -> ${newUrl}).`,
    ipAddress: ip,
  });

  res.json({ media: updated });
}

export function deleteMedia(req: AuthenticatedRequest, res: Response): void {
  const id = Number(req.params.id);
  const db = getDb();
  const ip = extractClientIp(req);

  const existing = db.prepare('SELECT * FROM media WHERE id = ?').get(id) as
    | { id: number; filename: string; url: string; original_name: string }
    | undefined;

  if (!existing) {
    res.status(404).json({ error: 'Media asset not found.' });
    return;
  }

  const refs = countMediaReferences(existing.url);
  if (refs > 0) {
    res.status(409).json({
      error: `Cannot delete "${existing.original_name}" because it is currently used by ${refs} published or draft item(s). Replace or detach it first.`,
    });
    return;
  }

  db.prepare('DELETE FROM media WHERE id = ?').run(id);

  if (existing.url.startsWith('/uploads/')) {
    const filePath = path.join(env.uploadsDir, path.basename(existing.url));
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  logAudit({
    userId: req.user?.id,
    userEmail: req.user?.email,
    action: 'MEDIA_DELETED',
    entityType: 'media',
    entityId: id,
    details: `Deleted unused media "${existing.original_name}" (${existing.url}).`,
    ipAddress: ip,
  });

  res.json({ message: 'Media asset deleted successfully.' });
}
