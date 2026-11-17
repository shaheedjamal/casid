import type { Response } from 'express';
import { getDb } from '../config/db';
import type { AuthenticatedRequest } from '../middleware/authMiddleware';
import { extractClientIp, logAudit } from '../services/auditService';
import { sanitizeText, sanitizeUrl, slugify } from '../services/sanitizeService';

export function listNews(req: AuthenticatedRequest, res: Response): void {
  const db = getDb();
  const isAdminScope = req.query.scope === 'admin' && Boolean(req.user);
  const status = typeof req.query.status === 'string' ? req.query.status.trim() : '';
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';

  const where: string[] = [];
  const params: unknown[] = [];

  if (!isAdminScope) {
    where.push("n.status = 'published'");
  } else if (status && status !== 'all') {
    where.push('n.status = ?');
    params.push(status);
  }

  if (search) {
    where.push('(n.title LIKE ? OR n.summary LIKE ? OR n.category_label LIKE ?)');
    const like = `%${search}%`;
    params.push(like, like, like);
  }

  const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
  const rows = db
    .prepare(`
      SELECT n.*, u.name as author_name
      FROM news n
      LEFT JOIN users u ON n.author_id = u.id
      ${whereSql}
      ORDER BY n.published_at DESC, n.id DESC
    `)
    .all(...params);

  res.json({ news: rows });
}

export function getNewsItem(req: AuthenticatedRequest, res: Response): void {
  const db = getDb();
  const idOrSlug = String(req.params.id || '').trim();
  const isNumeric = /^\d+$/.test(idOrSlug);

  const row = db
    .prepare(`
      SELECT n.*, u.name as author_name
      FROM news n
      LEFT JOIN users u ON n.author_id = u.id
      WHERE ${isNumeric ? 'n.id = ?' : 'n.slug = ?'}
    `)
    .get(isNumeric ? Number(idOrSlug) : idOrSlug) as Record<string, unknown> | undefined;

  if (!row) {
    res.status(404).json({ error: 'News article not found.' });
    return;
  }
  if (row.status !== 'published' && !req.user) {
    res.status(404).json({ error: 'News article not found.' });
    return;
  }

  res.json({ article: row });
}

export function createNews(req: AuthenticatedRequest, res: Response): void {
  const db = getDb();
  const ip = extractClientIp(req);

  const title = sanitizeText(req.body?.title, 220);
  const categoryLabel = sanitizeText(req.body?.category_label || 'Corporate Announcement', 80);
  const summary = sanitizeText(req.body?.summary, 500);
  const content = sanitizeText(req.body?.content, 15000);
  const imageUrl = sanitizeUrl(req.body?.image_url);
  const publishedAt = sanitizeText(req.body?.published_at || new Date().toISOString(), 40);

  let status = sanitizeText(req.body?.status || 'draft', 30);
  if (!['draft', 'pending_review', 'published', 'archived'].includes(status)) status = 'draft';
  if (req.user?.role === 'editor' && (status === 'published' || status === 'archived')) {
    status = 'pending_review';
  }

  if (!title || !summary || !content) {
    res.status(400).json({ error: 'News title, summary, and article content are required.' });
    return;
  }

  const baseSlug = slugify(req.body?.slug || title) || `news-${Date.now()}`;
  const conflict = db.prepare('SELECT id FROM news WHERE slug = ?').get(baseSlug);
  const finalSlug = conflict ? `${baseSlug}-${Date.now().toString().slice(-4)}` : baseSlug;

  const info = db
    .prepare(`
      INSERT INTO news (title, slug, category_label, summary, content, image_url, published_at, status, author_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .run(title, finalSlug, categoryLabel, summary, content, imageUrl, publishedAt, status, req.user?.id ?? null);

  const id = Number(info.lastInsertRowid);
  const created = db.prepare('SELECT * FROM news WHERE id = ?').get(id);

  logAudit({
    userId: req.user?.id,
    userEmail: req.user?.email,
    action: 'NEWS_CREATED',
    entityType: 'news',
    entityId: id,
    details: `Created news article "${title}" (status: ${status}).`,
    ipAddress: ip,
  });

  res.status(201).json({ article: created });
}

export function updateNews(req: AuthenticatedRequest, res: Response): void {
  const db = getDb();
  const id = Number(req.params.id);
  const ip = extractClientIp(req);

  const existing = db.prepare('SELECT * FROM news WHERE id = ?').get(id) as Record<string, unknown> | undefined;
  if (!existing) {
    res.status(404).json({ error: 'News article not found.' });
    return;
  }

  const title = sanitizeText(req.body?.title ?? existing.title, 220);
  const categoryLabel = sanitizeText(req.body?.category_label ?? existing.category_label, 80);
  const summary = sanitizeText(req.body?.summary ?? existing.summary, 500);
  const content = sanitizeText(req.body?.content ?? existing.content, 15000);
  const imageUrl =
    req.body?.image_url !== undefined ? sanitizeUrl(req.body.image_url) : String(existing.image_url || '');
  const publishedAt = sanitizeText(req.body?.published_at ?? existing.published_at, 40);

  let nextStatus = sanitizeText(req.body?.status ?? existing.status, 30);
  if (!['draft', 'pending_review', 'published', 'archived'].includes(nextStatus)) {
    nextStatus = String(existing.status);
  }
  if (req.user?.role === 'editor' && (nextStatus === 'published' || nextStatus === 'archived') && nextStatus !== existing.status) {
    res.status(403).json({
      error: 'Editors cannot publish or archive news articles directly. Submit for Super Admin approval.',
    });
    return;
  }

  if (!title || !summary || !content) {
    res.status(400).json({ error: 'News title, summary, and content are required.' });
    return;
  }

  db.prepare(`
    UPDATE news SET
      title = ?, category_label = ?, summary = ?, content = ?, image_url = ?,
      published_at = ?, status = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(title, categoryLabel, summary, content, imageUrl, publishedAt, nextStatus, id);

  const updated = db.prepare('SELECT * FROM news WHERE id = ?').get(id);

  logAudit({
    userId: req.user?.id,
    userEmail: req.user?.email,
    action: 'NEWS_UPDATED',
    entityType: 'news',
    entityId: id,
    details: `Updated news article "${title}" (status: ${nextStatus}).`,
    ipAddress: ip,
  });

  res.json({ article: updated });
}

export function deleteNews(req: AuthenticatedRequest, res: Response): void {
  const db = getDb();
  const id = Number(req.params.id);
  const ip = extractClientIp(req);

  const existing = db.prepare('SELECT id, title FROM news WHERE id = ?').get(id) as
    | { id: number; title: string }
    | undefined;
  if (!existing) {
    res.status(404).json({ error: 'News article not found.' });
    return;
  }

  db.prepare('DELETE FROM news WHERE id = ?').run(id);

  logAudit({
    userId: req.user?.id,
    userEmail: req.user?.email,
    action: 'NEWS_DELETED',
    entityType: 'news',
    entityId: id,
    details: `Deleted news article "${existing.title}".`,
    ipAddress: ip,
  });

  res.json({ message: 'News article deleted successfully.' });
}
