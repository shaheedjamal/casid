import type { Response } from 'express';
import { getDb } from '../config/db';
import type { AuthenticatedRequest } from '../middleware/authMiddleware';
import { extractClientIp, logAudit } from '../services/auditService';
import { sanitizeText, sanitizeUrl, slugify } from '../services/sanitizeService';

function formatPageRow(row: Record<string, unknown>) {
  let content = {};
  try {
    content = typeof row.content_json === 'string' ? JSON.parse(row.content_json) : row.content_json || {};
  } catch {
    content = {};
  }
  return {
    ...row,
    content,
  };
}

export function listPages(req: AuthenticatedRequest, res: Response): void {
  const db = getDb();
  const isAdminScope = req.query.scope === 'admin' && Boolean(req.user);

  const rows = db
    .prepare(`
      SELECT p.*, u.name as updated_by_name
      FROM pages p
      LEFT JOIN users u ON p.updated_by = u.id
      ${isAdminScope ? '' : "WHERE p.status = 'published'"}
      ORDER BY p.id ASC
    `)
    .all() as Array<Record<string, unknown>>;

  res.json({ pages: rows.map(formatPageRow) });
}

export function getPageBySlug(req: AuthenticatedRequest, res: Response): void {
  const db = getDb();
  const slug = sanitizeText(req.params.slug, 120);
  const preview = req.query.preview === 'true' && Boolean(req.user);

  const row = db
    .prepare('SELECT * FROM pages WHERE slug = ?')
    .get(slug) as Record<string, unknown> | undefined;

  if (!row) {
    res.status(404).json({ error: 'Page not found.' });
    return;
  }

  if (row.status !== 'published' && !preview && !req.user) {
    res.status(404).json({ error: 'Page is not currently published.' });
    return;
  }

  res.json({ page: formatPageRow(row) });
}

export function createPage(req: AuthenticatedRequest, res: Response): void {
  const db = getDb();
  const ip = extractClientIp(req);

  const title = sanitizeText(req.body?.title, 200);
  const slug = slugify(req.body?.slug || title);
  const subtitle = sanitizeText(req.body?.subtitle, 500);
  const heroImageUrl = sanitizeUrl(req.body?.hero_image_url);
  const metaDescription = sanitizeText(req.body?.meta_description, 320);

  let status = sanitizeText(req.body?.status || 'draft', 30);
  if (!['draft', 'pending_review', 'published', 'archived'].includes(status)) status = 'draft';
  if (req.user?.role === 'editor' && (status === 'published' || status === 'archived')) {
    status = 'pending_review';
  }

  if (!title || !slug) {
    res.status(400).json({ error: 'Page title and slug are required.' });
    return;
  }

  const conflict = db.prepare('SELECT id FROM pages WHERE slug = ?').get(slug);
  if (conflict) {
    res.status(409).json({ error: `A page with slug "${slug}" already exists.` });
    return;
  }

  const contentJson =
    typeof req.body?.content === 'string'
      ? req.body.content
      : JSON.stringify(req.body?.content || {});

  const info = db
    .prepare(`
      INSERT INTO pages (slug, title, subtitle, hero_image_url, content_json, meta_description, status, updated_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .run(slug, title, subtitle, heroImageUrl, contentJson, metaDescription, status, req.user?.id ?? null);

  const id = Number(info.lastInsertRowid);
  const created = db.prepare('SELECT * FROM pages WHERE id = ?').get(id) as Record<string, unknown>;

  logAudit({
    userId: req.user?.id,
    userEmail: req.user?.email,
    action: 'PAGE_CREATED',
    entityType: 'page',
    entityId: id,
    details: `Created CMS page "/${slug}" with status "${status}".`,
    ipAddress: ip,
  });

  res.status(201).json({ page: formatPageRow(created) });
}

export function updatePage(req: AuthenticatedRequest, res: Response): void {
  const db = getDb();
  const id = Number(req.params.id);
  const ip = extractClientIp(req);

  const existing = db.prepare('SELECT * FROM pages WHERE id = ?').get(id) as Record<string, unknown> | undefined;
  if (!existing) {
    res.status(404).json({ error: 'Page not found.' });
    return;
  }

  const title = sanitizeText(req.body?.title ?? existing.title, 200);
  const subtitle = sanitizeText(req.body?.subtitle ?? existing.subtitle, 500);
  const heroImageUrl =
    req.body?.hero_image_url !== undefined ? sanitizeUrl(req.body.hero_image_url) : String(existing.hero_image_url || '');
  const metaDescription = sanitizeText(req.body?.meta_description ?? existing.meta_description, 320);

  let nextStatus = sanitizeText(req.body?.status ?? existing.status, 30);
  if (!['draft', 'pending_review', 'published', 'archived'].includes(nextStatus)) {
    nextStatus = String(existing.status);
  }
  if (req.user?.role === 'editor' && (nextStatus === 'published' || nextStatus === 'archived') && nextStatus !== existing.status) {
    res.status(403).json({
      error: 'Editors cannot directly publish or archive CMS pages. Please submit for Super Admin approval.',
    });
    return;
  }

  let contentJson = String(existing.content_json || '{}');
  if (req.body?.content !== undefined) {
    if (typeof req.body.content === 'string') {
      try {
        JSON.parse(req.body.content);
        contentJson = req.body.content;
      } catch {
        res.status(400).json({ error: 'Page content JSON is malformed.' });
        return;
      }
    } else {
      contentJson = JSON.stringify(req.body.content);
    }
  }

  db.prepare(`
    UPDATE pages SET
      title = ?, subtitle = ?, hero_image_url = ?, content_json = ?,
      meta_description = ?, status = ?, updated_by = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(title, subtitle, heroImageUrl, contentJson, metaDescription, nextStatus, req.user?.id ?? null, id);

  const updated = db.prepare('SELECT * FROM pages WHERE id = ?').get(id) as Record<string, unknown>;

  logAudit({
    userId: req.user?.id,
    userEmail: req.user?.email,
    action: 'PAGE_UPDATED',
    entityType: 'page',
    entityId: id,
    details: `Updated CMS page "${existing.slug}" (status: ${nextStatus}).`,
    ipAddress: ip,
  });

  res.json({ page: formatPageRow(updated) });
}
