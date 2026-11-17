import type { Response } from 'express';
import { getDb } from '../config/db';
import type { AuthenticatedRequest } from '../middleware/authMiddleware';
import { extractClientIp, logAudit } from '../services/auditService';
import { sanitizeText, sanitizeUrl, slugify } from '../services/sanitizeService';

export function listProducts(req: AuthenticatedRequest, res: Response): void {
  const db = getDb();
  const isAdminScope = req.query.scope === 'admin' && Boolean(req.user);
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
  const category = typeof req.query.category === 'string' ? req.query.category.trim() : '';
  const status = typeof req.query.status === 'string' ? req.query.status.trim() : '';
  const featured = req.query.featured === '1' || req.query.featured === 'true';

  const where: string[] = [];
  const params: unknown[] = [];

  if (!isAdminScope) {
    where.push("p.status = 'published'");
    where.push("c.status = 'active'");
  } else if (status && status !== 'all') {
    where.push('p.status = ?');
    params.push(status);
  }

  if (category && category !== 'all') {
    if (/^\d+$/.test(category)) {
      where.push('p.category_id = ?');
      params.push(Number(category));
    } else {
      where.push('c.slug = ?');
      params.push(category);
    }
  }

  if (featured) {
    where.push('p.is_featured = 1');
  }

  if (search) {
    where.push('(p.name LIKE ? OR p.sku LIKE ? OR p.short_description LIKE ? OR p.therapeutic_area LIKE ?)');
    const like = `%${search}%`;
    params.push(like, like, like, like);
  }

  const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
  const rows = db
    .prepare(`
      SELECT p.*, c.name as category_name, c.slug as category_slug
      FROM products p
      JOIN categories c ON p.category_id = c.id
      ${whereSql}
      ORDER BY p.is_featured DESC, p.updated_at DESC, p.id DESC
    `)
    .all(...params);

  res.json({ products: rows });
}

export function getProduct(req: AuthenticatedRequest, res: Response): void {
  const db = getDb();
  const idOrSlug = String(req.params.id || '').trim();
  const isNumeric = /^\d+$/.test(idOrSlug);

  const row = db
    .prepare(`
      SELECT p.*, c.name as category_name, c.slug as category_slug
      FROM products p
      JOIN categories c ON p.category_id = c.id
      WHERE ${isNumeric ? 'p.id = ?' : 'p.slug = ?'}
    `)
    .get(isNumeric ? Number(idOrSlug) : idOrSlug) as Record<string, unknown> | undefined;

  if (!row) {
    res.status(404).json({ error: 'Product not found.' });
    return;
  }

  if (row.status !== 'published' && !req.user) {
    res.status(404).json({ error: 'Product not found.' });
    return;
  }

  res.json({ product: row });
}

export function createProduct(req: AuthenticatedRequest, res: Response): void {
  const db = getDb();
  const ip = extractClientIp(req);

  const name = sanitizeText(req.body?.name, 160);
  const sku = sanitizeText(req.body?.sku, 64).toUpperCase();
  const categoryId = Number(req.body?.category_id);
  const dosageForm = sanitizeText(req.body?.dosage_form, 120);
  const strength = sanitizeText(req.body?.strength, 120);
  const therapeuticArea = sanitizeText(req.body?.therapeutic_area, 160);
  const shortDescription = sanitizeText(req.body?.short_description, 500);
  const description = sanitizeText(req.body?.description, 8000);
  const composition = sanitizeText(req.body?.composition, 1000);
  const packagingInfo = sanitizeText(req.body?.packaging_info, 500);
  const storageConditions = sanitizeText(req.body?.storage_conditions, 500);
  const imageUrl = sanitizeUrl(req.body?.image_url);
  const isFeatured = req.body?.is_featured ? 1 : 0;

  let requestedStatus = sanitizeText(req.body?.status || 'draft', 30);
  if (!['draft', 'pending_review', 'published', 'archived'].includes(requestedStatus)) {
    requestedStatus = 'draft';
  }
  // Editors submit content for approval; only Super Admin can publish directly
  if (req.user?.role === 'editor' && (requestedStatus === 'published' || requestedStatus === 'archived')) {
    requestedStatus = 'pending_review';
  }

  if (!name || !sku || !Number.isInteger(categoryId) || categoryId <= 0) {
    res.status(400).json({ error: 'Product name, SKU, and valid category are required.' });
    return;
  }

  const categoryExists = db.prepare('SELECT id FROM categories WHERE id = ?').get(categoryId);
  if (!categoryExists) {
    res.status(400).json({ error: 'Selected category does not exist.' });
    return;
  }

  const baseSlug = slugify(req.body?.slug || name) || `product-${Date.now()}`;
  const slugConflict = db.prepare('SELECT id FROM products WHERE slug = ?').get(baseSlug);
  const finalSlug = slugConflict ? `${baseSlug}-${Date.now().toString().slice(-4)}` : baseSlug;

  const skuConflict = db.prepare('SELECT id FROM products WHERE sku = ?').get(sku);
  if (skuConflict) {
    res.status(409).json({ error: `SKU "${sku}" is already assigned to another product.` });
    return;
  }

  const info = db
    .prepare(`
      INSERT INTO products (
        name, slug, sku, category_id, dosage_form, strength, therapeutic_area,
        short_description, description, composition, packaging_info, storage_conditions,
        image_url, is_featured, status, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      name,
      finalSlug,
      sku,
      categoryId,
      dosageForm,
      strength,
      therapeuticArea,
      shortDescription,
      description,
      composition,
      packagingInfo,
      storageConditions,
      imageUrl,
      isFeatured,
      requestedStatus,
      req.user?.id ?? null
    );

  const productId = Number(info.lastInsertRowid);
  const created = db
    .prepare(`
      SELECT p.*, c.name as category_name, c.slug as category_slug
      FROM products p JOIN categories c ON p.category_id = c.id WHERE p.id = ?
    `)
    .get(productId);

  logAudit({
    userId: req.user?.id,
    userEmail: req.user?.email,
    action: 'PRODUCT_CREATED',
    entityType: 'product',
    entityId: productId,
    details: `Created product "${name}" (${sku}) with status "${requestedStatus}".`,
    ipAddress: ip,
  });

  res.status(201).json({ product: created });
}

export function updateProduct(req: AuthenticatedRequest, res: Response): void {
  const db = getDb();
  const id = Number(req.params.id);
  const ip = extractClientIp(req);

  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(id) as Record<string, unknown> | undefined;
  if (!existing) {
    res.status(404).json({ error: 'Product not found.' });
    return;
  }

  const name = sanitizeText(req.body?.name ?? existing.name, 160);
  const sku = sanitizeText(req.body?.sku ?? existing.sku, 64).toUpperCase();
  const categoryId = req.body?.category_id !== undefined ? Number(req.body.category_id) : Number(existing.category_id);
  const dosageForm = sanitizeText(req.body?.dosage_form ?? existing.dosage_form, 120);
  const strength = sanitizeText(req.body?.strength ?? existing.strength, 120);
  const therapeuticArea = sanitizeText(req.body?.therapeutic_area ?? existing.therapeutic_area, 160);
  const shortDescription = sanitizeText(req.body?.short_description ?? existing.short_description, 500);
  const description = sanitizeText(req.body?.description ?? existing.description, 8000);
  const composition = sanitizeText(req.body?.composition ?? existing.composition, 1000);
  const packagingInfo = sanitizeText(req.body?.packaging_info ?? existing.packaging_info, 500);
  const storageConditions = sanitizeText(req.body?.storage_conditions ?? existing.storage_conditions, 500);
  const imageUrl = req.body?.image_url !== undefined ? sanitizeUrl(req.body.image_url) : String(existing.image_url || '');
  const isFeatured = req.body?.is_featured !== undefined ? (req.body.is_featured ? 1 : 0) : Number(existing.is_featured);

  let nextStatus = sanitizeText(req.body?.status ?? existing.status, 30);
  if (!['draft', 'pending_review', 'published', 'archived'].includes(nextStatus)) {
    nextStatus = String(existing.status);
  }
  if (req.user?.role === 'editor' && (nextStatus === 'published' || nextStatus === 'archived') && nextStatus !== existing.status) {
    res.status(403).json({
      error: 'Editors cannot publish or archive products directly. Submit for Super Admin approval instead.',
    });
    return;
  }

  if (!name || !sku || !Number.isInteger(categoryId) || categoryId <= 0) {
    res.status(400).json({ error: 'Product name, SKU, and category are required.' });
    return;
  }

  const skuConflict = db.prepare('SELECT id FROM products WHERE sku = ? AND id != ?').get(sku, id);
  if (skuConflict) {
    res.status(409).json({ error: `SKU "${sku}" is already assigned to another product.` });
    return;
  }

  db.prepare(`
    UPDATE products SET
      name = ?, sku = ?, category_id = ?, dosage_form = ?, strength = ?,
      therapeutic_area = ?, short_description = ?, description = ?,
      composition = ?, packaging_info = ?, storage_conditions = ?,
      image_url = ?, is_featured = ?, status = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(
    name,
    sku,
    categoryId,
    dosageForm,
    strength,
    therapeuticArea,
    shortDescription,
    description,
    composition,
    packagingInfo,
    storageConditions,
    imageUrl,
    isFeatured,
    nextStatus,
    id
  );

  const updated = db
    .prepare(`
      SELECT p.*, c.name as category_name, c.slug as category_slug
      FROM products p JOIN categories c ON p.category_id = c.id WHERE p.id = ?
    `)
    .get(id);

  logAudit({
    userId: req.user?.id,
    userEmail: req.user?.email,
    action: 'PRODUCT_UPDATED',
    entityType: 'product',
    entityId: id,
    details: `Updated product "${name}" (${sku}), status "${nextStatus}".`,
    ipAddress: ip,
  });

  res.json({ product: updated });
}

export function deleteProduct(req: AuthenticatedRequest, res: Response): void {
  const db = getDb();
  const id = Number(req.params.id);
  const ip = extractClientIp(req);

  const existing = db.prepare('SELECT id, name, sku FROM products WHERE id = ?').get(id) as
    | { id: number; name: string; sku: string }
    | undefined;
  if (!existing) {
    res.status(404).json({ error: 'Product not found.' });
    return;
  }

  db.prepare('DELETE FROM products WHERE id = ?').run(id);

  logAudit({
    userId: req.user?.id,
    userEmail: req.user?.email,
    action: 'PRODUCT_DELETED',
    entityType: 'product',
    entityId: id,
    details: `Deleted product "${existing.name}" (${existing.sku}).`,
    ipAddress: ip,
  });

  res.json({ message: 'Product deleted successfully.' });
}
