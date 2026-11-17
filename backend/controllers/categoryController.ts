import type { Response } from 'express';
import { getDb } from '../config/db';
import type { AuthenticatedRequest } from '../middleware/authMiddleware';
import { extractClientIp, logAudit } from '../services/auditService';
import { sanitizeText, sanitizeUrl, slugify } from '../services/sanitizeService';

export function listCategories(req: AuthenticatedRequest, res: Response): void {
  const db = getDb();
  const isAdminScope = req.query.scope === 'admin' && Boolean(req.user);

  const rows = db
    .prepare(`
      SELECT
        c.*,
        COUNT(CASE WHEN ${isAdminScope ? '1=1' : "p.status = 'published'"} THEN p.id END) as product_count,
        COUNT(p.id) as total_product_count
      FROM categories c
      LEFT JOIN products p ON p.category_id = c.id
      ${isAdminScope ? '' : "WHERE c.status = 'active'"}
      GROUP BY c.id
      ORDER BY c.name ASC
    `)
    .all();

  res.json({ categories: rows });
}

export function createCategory(req: AuthenticatedRequest, res: Response): void {
  const db = getDb();
  const ip = extractClientIp(req);

  const name = sanitizeText(req.body?.name, 120);
  const description = sanitizeText(req.body?.description, 1000);
  const imageUrl = sanitizeUrl(req.body?.image_url);
  const status = req.body?.status === 'inactive' ? 'inactive' : 'active';

  if (!name || name.length < 2) {
    res.status(400).json({ error: 'Category name is required.' });
    return;
  }

  const slug = slugify(req.body?.slug || name);
  const conflict = db.prepare('SELECT id FROM categories WHERE name = ? OR slug = ?').get(name, slug);
  if (conflict) {
    res.status(409).json({ error: 'A category with this name or slug already exists.' });
    return;
  }

  const info = db
    .prepare(`
      INSERT INTO categories (name, slug, description, image_url, status)
      VALUES (?, ?, ?, ?, ?)
    `)
    .run(name, slug, description, imageUrl, status);

  const id = Number(info.lastInsertRowid);
  const created = db
    .prepare('SELECT *, 0 as product_count, 0 as total_product_count FROM categories WHERE id = ?')
    .get(id);

  logAudit({
    userId: req.user?.id,
    userEmail: req.user?.email,
    action: 'CATEGORY_CREATED',
    entityType: 'category',
    entityId: id,
    details: `Created category "${name}".`,
    ipAddress: ip,
  });

  res.status(201).json({ category: created });
}

export function updateCategory(req: AuthenticatedRequest, res: Response): void {
  const db = getDb();
  const id = Number(req.params.id);
  const ip = extractClientIp(req);

  const existing = db.prepare('SELECT * FROM categories WHERE id = ?').get(id) as Record<string, unknown> | undefined;
  if (!existing) {
    res.status(404).json({ error: 'Category not found.' });
    return;
  }

  const name = sanitizeText(req.body?.name ?? existing.name, 120);
  const description = sanitizeText(req.body?.description ?? existing.description, 1000);
  const imageUrl = req.body?.image_url !== undefined ? sanitizeUrl(req.body.image_url) : String(existing.image_url || '');
  const status = req.body?.status === 'inactive' ? 'inactive' : 'active';

  if (!name) {
    res.status(400).json({ error: 'Category name cannot be empty.' });
    return;
  }

  const duplicate = db.prepare('SELECT id FROM categories WHERE name = ? AND id != ?').get(name, id);
  if (duplicate) {
    res.status(409).json({ error: 'Another category already uses this name.' });
    return;
  }

  db.prepare(`
    UPDATE categories SET name = ?, description = ?, image_url = ?, status = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(name, description, imageUrl, status, id);

  const updated = db
    .prepare(`
      SELECT c.*, COUNT(p.id) as product_count, COUNT(p.id) as total_product_count
      FROM categories c LEFT JOIN products p ON p.category_id = c.id
      WHERE c.id = ? GROUP BY c.id
    `)
    .get(id);

  logAudit({
    userId: req.user?.id,
    userEmail: req.user?.email,
    action: 'CATEGORY_UPDATED',
    entityType: 'category',
    entityId: id,
    details: `Updated category "${name}" (status: ${status}).`,
    ipAddress: ip,
  });

  res.json({ category: updated });
}

export function deleteCategory(req: AuthenticatedRequest, res: Response): void {
  const db = getDb();
  const id = Number(req.params.id);
  const ip = extractClientIp(req);
  const reassignTo = req.query.reassignTo ? Number(req.query.reassignTo) : null;

  const existing = db.prepare('SELECT id, name FROM categories WHERE id = ?').get(id) as
    | { id: number; name: string }
    | undefined;
  if (!existing) {
    res.status(404).json({ error: 'Category not found.' });
    return;
  }

  const refCount = (db.prepare('SELECT COUNT(*) as count FROM products WHERE category_id = ?').get(id) as { count: number })
    .count;

  if (refCount > 0) {
    if (!reassignTo || reassignTo === id) {
      res.status(409).json({
        error: `Cannot delete "${existing.name}" because ${refCount} product(s) still reference it. Reassign those products to another category first.`,
        referencingProducts: refCount,
      });
      return;
    }

    const targetCategory = db.prepare('SELECT id, name FROM categories WHERE id = ?').get(reassignTo) as
      | { id: number; name: string }
      | undefined;
    if (!targetCategory) {
      res.status(400).json({ error: 'Target reassignment category does not exist.' });
      return;
    }

    const deleteTx = db.transaction(() => {
      db.prepare('UPDATE products SET category_id = ?, updated_at = datetime(\'now\') WHERE category_id = ?').run(
        reassignTo,
        id
      );
      db.prepare('DELETE FROM categories WHERE id = ?').run(id);
    });
    deleteTx();

    logAudit({
      userId: req.user?.id,
      userEmail: req.user?.email,
      action: 'CATEGORY_DELETED_WITH_REASSIGN',
      entityType: 'category',
      entityId: id,
      details: `Reassigned ${refCount} product(s) to "${targetCategory.name}" and deleted category "${existing.name}".`,
      ipAddress: ip,
    });

    res.json({
      message: `Reassigned ${refCount} product(s) to "${targetCategory.name}" and deleted "${existing.name}".`,
    });
    return;
  }

  db.prepare('DELETE FROM categories WHERE id = ?').run(id);

  logAudit({
    userId: req.user?.id,
    userEmail: req.user?.email,
    action: 'CATEGORY_DELETED',
    entityType: 'category',
    entityId: id,
    details: `Deleted unused category "${existing.name}".`,
    ipAddress: ip,
  });

  res.json({ message: 'Category deleted successfully.' });
}
