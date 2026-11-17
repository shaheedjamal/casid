import bcrypt from 'bcryptjs';
import type { Response } from 'express';
import { getDb } from '../config/db';
import type { AuthenticatedRequest, UserRole } from '../middleware/authMiddleware';
import { extractClientIp, logAudit } from '../services/auditService';
import { isValidEmail, sanitizeText, validateStrongPassword } from '../services/sanitizeService';

export function getDashboardStats(_req: AuthenticatedRequest, res: Response): void {
  const db = getDb();

  const totalProducts = (db.prepare('SELECT COUNT(*) as c FROM products').get() as { c: number }).c;
  const publishedProducts = (db.prepare("SELECT COUNT(*) as c FROM products WHERE status = 'published'").get() as { c: number }).c;
  const totalCategories = (db.prepare('SELECT COUNT(*) as c FROM categories').get() as { c: number }).c;
  const totalPages = (db.prepare('SELECT COUNT(*) as c FROM pages').get() as { c: number }).c;
  const publishedPages = (db.prepare("SELECT COUNT(*) as c FROM pages WHERE status = 'published'").get() as { c: number }).c;
  const totalNews = (db.prepare('SELECT COUNT(*) as c FROM news').get() as { c: number }).c;
  const publishedNews = (db.prepare("SELECT COUNT(*) as c FROM news WHERE status = 'published'").get() as { c: number }).c;
  const totalEnquiries = (db.prepare('SELECT COUNT(*) as c FROM enquiries').get() as { c: number }).c;
  const pendingEnquiries = (db.prepare("SELECT COUNT(*) as c FROM enquiries WHERE status = 'pending'").get() as { c: number }).c;
  const totalUsers = (db.prepare('SELECT COUNT(*) as c FROM users').get() as { c: number }).c;
  const totalMedia = (db.prepare('SELECT COUNT(*) as c FROM media').get() as { c: number }).c;

  const pendingReviewProducts = (db.prepare("SELECT COUNT(*) as c FROM products WHERE status = 'pending_review'").get() as { c: number }).c;
  const pendingReviewPages = (db.prepare("SELECT COUNT(*) as c FROM pages WHERE status = 'pending_review'").get() as { c: number }).c;
  const pendingReviewNews = (db.prepare("SELECT COUNT(*) as c FROM news WHERE status = 'pending_review'").get() as { c: number }).c;

  const recentLogs = db
    .prepare('SELECT * FROM audit_logs ORDER BY created_at DESC, id DESC LIMIT 8')
    .all();

  const recentEnquiries = db
    .prepare('SELECT * FROM enquiries ORDER BY created_at DESC, id DESC LIMIT 6')
    .all();

  const contentStatus = {
    products: db
      .prepare('SELECT status, COUNT(*) as count FROM products GROUP BY status')
      .all() as Array<{ status: string; count: number }>,
    pages: db
      .prepare('SELECT status, COUNT(*) as count FROM pages GROUP BY status')
      .all() as Array<{ status: string; count: number }>,
    news: db
      .prepare('SELECT status, COUNT(*) as count FROM news GROUP BY status')
      .all() as Array<{ status: string; count: number }>,
  };

  res.json({
    stats: {
      totalProducts,
      publishedProducts,
      totalCategories,
      totalPages,
      publishedPages,
      totalNews,
      publishedNews,
      totalEnquiries,
      pendingEnquiries,
      totalUsers,
      totalMedia,
      pendingApprovals: pendingReviewProducts + pendingReviewPages + pendingReviewNews,
    },
    recentLogs,
    recentEnquiries,
    contentStatus,
  });
}

export function listUsers(_req: AuthenticatedRequest, res: Response): void {
  const db = getDb();
  const users = db
    .prepare('SELECT id, name, email, role, status, last_login_at, created_at, updated_at FROM users ORDER BY id ASC')
    .all();
  res.json({ users });
}

export function createUser(req: AuthenticatedRequest, res: Response): void {
  const db = getDb();
  const ip = extractClientIp(req);

  const name = sanitizeText(req.body?.name, 120);
  const email = sanitizeText(req.body?.email, 180).toLowerCase();
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  const role: UserRole = req.body?.role === 'super_admin' ? 'super_admin' : 'editor';

  if (!name || name.length < 2) {
    res.status(400).json({ error: 'Full name is required.' });
    return;
  }
  if (!isValidEmail(email)) {
    res.status(400).json({ error: 'Valid email address is required.' });
    return;
  }
  const pwCheck = validateStrongPassword(password);
  if (!pwCheck.valid) {
    res.status(400).json({ error: pwCheck.message });
    return;
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    res.status(409).json({ error: 'An administrator account with this email already exists.' });
    return;
  }

  const hash = bcrypt.hashSync(password, 12);
  const info = db
    .prepare(`
      INSERT INTO users (name, email, password_hash, role, status)
      VALUES (?, ?, ?, ?, 'active')
    `)
    .run(name, email, hash, role);

  const id = Number(info.lastInsertRowid);
  const created = db
    .prepare('SELECT id, name, email, role, status, last_login_at, created_at FROM users WHERE id = ?')
    .get(id);

  logAudit({
    userId: req.user?.id,
    userEmail: req.user?.email,
    action: 'ADMIN_USER_CREATED',
    entityType: 'user',
    entityId: id,
    details: `Created administrator "${email}" with role "${role}".`,
    ipAddress: ip,
  });

  res.status(201).json({ user: created });
}

export function updateUser(req: AuthenticatedRequest, res: Response): void {
  const db = getDb();
  const id = Number(req.params.id);
  const ip = extractClientIp(req);

  const existing = db
    .prepare('SELECT id, name, email, role, status FROM users WHERE id = ?')
    .get(id) as { id: number; name: string; email: string; role: UserRole; status: string } | undefined;

  if (!existing) {
    res.status(404).json({ error: 'User not found.' });
    return;
  }

  const name = sanitizeText(req.body?.name ?? existing.name, 120);
  const nextRole: UserRole = req.body?.role === 'super_admin' ? 'super_admin' : req.body?.role === 'editor' ? 'editor' : existing.role;
  const nextStatus = req.body?.status === 'inactive' ? 'inactive' : req.body?.status === 'active' ? 'active' : existing.status;

  // Guard against removing or deactivating the last active Super Admin
  if (existing.role === 'super_admin' && (nextRole !== 'super_admin' || nextStatus !== 'active')) {
    const activeSuperAdmins = (
      db.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'super_admin' AND status = 'active'").get() as { c: number }
    ).c;
    if (activeSuperAdmins <= 1) {
      res.status(409).json({
        error: 'Cannot demote or deactivate the last active Super Admin account.',
      });
      return;
    }
  }

  if (typeof req.body?.password === 'string' && req.body.password.length > 0) {
    const pwCheck = validateStrongPassword(req.body.password);
    if (!pwCheck.valid) {
      res.status(400).json({ error: pwCheck.message });
      return;
    }
    const newHash = bcrypt.hashSync(req.body.password, 12);
    db.prepare("UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?").run(newHash, id);
  }

  db.prepare(`
    UPDATE users SET name = ?, role = ?, status = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(name, nextRole, nextStatus, id);

  const updated = db
    .prepare('SELECT id, name, email, role, status, last_login_at, created_at, updated_at FROM users WHERE id = ?')
    .get(id);

  logAudit({
    userId: req.user?.id,
    userEmail: req.user?.email,
    action: 'ADMIN_USER_UPDATED',
    entityType: 'user',
    entityId: id,
    details: `Updated user ${existing.email} (role: ${nextRole}, status: ${nextStatus}).`,
    ipAddress: ip,
  });

  res.json({ user: updated });
}

export function listAuditLogs(req: AuthenticatedRequest, res: Response): void {
  const db = getDb();
  const entityType = typeof req.query.entity_type === 'string' ? req.query.entity_type.trim() : '';
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
  const limit = Math.min(200, Math.max(10, Number(req.query.limit || 100)));

  const where: string[] = [];
  const params: unknown[] = [];

  if (entityType && entityType !== 'all') {
    where.push('entity_type = ?');
    params.push(entityType);
  }
  if (search) {
    where.push('(user_email LIKE ? OR action LIKE ? OR details LIKE ?)');
    const like = `%${search}%`;
    params.push(like, like, like);
  }

  const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
  const logs = db
    .prepare(`SELECT * FROM audit_logs ${whereSql} ORDER BY created_at DESC, id DESC LIMIT ?`)
    .all(...params, limit);

  res.json({ logs });
}

export function getSettings(_req: AuthenticatedRequest, res: Response): void {
  const db = getDb();
  const rows = db.prepare('SELECT key, value, updated_at FROM system_settings').all() as Array<{
    key: string;
    value: string;
    updated_at: string;
  }>;
  const settings: Record<string, string> = {};
  for (const r of rows) {
    settings[r.key] = r.value;
  }
  res.json({ settings });
}

export function updateSettings(req: AuthenticatedRequest, res: Response): void {
  const db = getDb();
  const ip = extractClientIp(req);
  const incoming = req.body?.settings;

  if (!incoming || typeof incoming !== 'object') {
    res.status(400).json({ error: 'Settings payload is required.' });
    return;
  }

  const allowedKeys = ['site_name', 'support_email', 'maintenance_mode', 'enquiry_retention_days'];
  const upsert = db.prepare(`
    INSERT INTO system_settings (key, value, updated_by, updated_at)
    VALUES (?, ?, ?, datetime('now'))
    ON CONFLICT(key) DO UPDATE SET
      value = excluded.value,
      updated_by = excluded.updated_by,
      updated_at = datetime('now')
  `);

  const tx = db.transaction(() => {
    for (const key of allowedKeys) {
      if (incoming[key] !== undefined) {
        upsert.run(key, sanitizeText(String(incoming[key]), 500), req.user?.id ?? null);
      }
    }
  });
  tx();

  logAudit({
    userId: req.user?.id,
    userEmail: req.user?.email,
    action: 'SETTINGS_UPDATED',
    entityType: 'system',
    details: 'Updated system maintenance and configuration settings.',
    ipAddress: ip,
  });

  res.json({ message: 'System settings saved.' });
}

export function exportBackup(req: AuthenticatedRequest, res: Response): void {
  const db = getDb();
  const ip = extractClientIp(req);

  const backup = {
    schemaVersion: '1.0',
    exportedAt: new Date().toISOString(),
    exportedBy: req.user?.email || 'system',
    tables: {
      categories: db.prepare('SELECT * FROM categories ORDER BY id ASC').all(),
      products: db.prepare('SELECT * FROM products ORDER BY id ASC').all(),
      pages: db.prepare('SELECT * FROM pages ORDER BY id ASC').all(),
      news: db.prepare('SELECT * FROM news ORDER BY id ASC').all(),
      media: db.prepare('SELECT * FROM media ORDER BY id ASC').all(),
      enquiries: db.prepare('SELECT * FROM enquiries ORDER BY id ASC').all(),
      system_settings: db.prepare('SELECT * FROM system_settings ORDER BY key ASC').all(),
    },
  };

  logAudit({
    userId: req.user?.id,
    userEmail: req.user?.email,
    action: 'BACKUP_EXPORTED',
    entityType: 'system',
    details: `Exported JSON database snapshot (${backup.tables.products.length} products, ${backup.tables.pages.length} pages, ${backup.tables.news.length} news).`,
    ipAddress: ip,
  });

  res.setHeader('Content-Disposition', `attachment; filename="casid-pharma-backup-${Date.now()}.json"`);
  res.json(backup);
}

export function restoreBackup(req: AuthenticatedRequest, res: Response): void {
  const db = getDb();
  const ip = extractClientIp(req);
  const payload = req.body;

  if (!payload || payload.schemaVersion !== '1.0' || !payload.tables) {
    res.status(400).json({ error: 'Invalid backup snapshot format.' });
    return;
  }

  const { categories, products, pages, news, system_settings } = payload.tables;
  if (!Array.isArray(categories) || !Array.isArray(products) || !Array.isArray(pages) || !Array.isArray(news)) {
    res.status(400).json({ error: 'Backup snapshot is missing required core tables.' });
    return;
  }

  try {
    const restoreTx = db.transaction(() => {
      db.prepare('DELETE FROM products').run();
      db.prepare('DELETE FROM categories').run();
      db.prepare('DELETE FROM pages').run();
      db.prepare('DELETE FROM news').run();

      const insertCat = db.prepare(`
        INSERT INTO categories (id, name, slug, description, image_url, status, created_at, updated_at)
        VALUES (@id, @name, @slug, @description, @image_url, @status, @created_at, @updated_at)
      `);
      for (const row of categories) insertCat.run(row);

      const insertProd = db.prepare(`
        INSERT INTO products (
          id, name, slug, sku, category_id, dosage_form, strength, therapeutic_area,
          short_description, description, composition, packaging_info, storage_conditions,
          image_url, is_featured, status, created_at, updated_at
        ) VALUES (
          @id, @name, @slug, @sku, @category_id, @dosage_form, @strength, @therapeutic_area,
          @short_description, @description, @composition, @packaging_info, @storage_conditions,
          @image_url, @is_featured, @status, @created_at, @updated_at
        )
      `);
      for (const row of products) insertProd.run(row);

      const insertPage = db.prepare(`
        INSERT INTO pages (id, slug, title, subtitle, hero_image_url, content_json, meta_description, status, created_at, updated_at)
        VALUES (@id, @slug, @title, @subtitle, @hero_image_url, @content_json, @meta_description, @status, @created_at, @updated_at)
      `);
      for (const row of pages) insertPage.run(row);

      const insertNews = db.prepare(`
        INSERT INTO news (id, title, slug, category_label, summary, content, image_url, published_at, status, created_at, updated_at)
        VALUES (@id, @title, @slug, @category_label, @summary, @content, @image_url, @published_at, @status, @created_at, @updated_at)
      `);
      for (const row of news) insertNews.run(row);

      if (Array.isArray(system_settings)) {
        const upsertSetting = db.prepare(`
          INSERT INTO system_settings (key, value, updated_at)
          VALUES (@key, @value, @updated_at)
          ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
        `);
        for (const row of system_settings) upsertSetting.run(row);
      }
    });

    restoreTx();

    logAudit({
      userId: req.user?.id,
      userEmail: req.user?.email,
      action: 'BACKUP_RESTORED',
      entityType: 'system',
      details: `Restored content backup exported at ${payload.exportedAt || 'unknown'}.`,
      ipAddress: ip,
    });

    res.json({ message: 'Backup snapshot restored successfully.' });
  } catch (err) {
    console.error('[BackupRestore] Failed:', err);
    res.status(400).json({ error: 'Backup restore failed due to invalid data integrity.' });
  }
}
