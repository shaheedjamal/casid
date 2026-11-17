import crypto from 'crypto';
import type { Request, Response } from 'express';
import { getDb } from '../config/db';
import type { AuthenticatedRequest } from '../middleware/authMiddleware';
import { extractClientIp, logAudit } from '../services/auditService';
import { isValidEmail, sanitizeText } from '../services/sanitizeService';

export function submitEnquiry(req: Request, res: Response): void {
  const db = getDb();
  const ip = extractClientIp(req);

  const name = sanitizeText(req.body?.name, 140);
  const email = sanitizeText(req.body?.email, 180).toLowerCase();
  const phone = sanitizeText(req.body?.phone || '', 40);
  const company = sanitizeText(req.body?.company || '', 160);
  const subject = sanitizeText(req.body?.subject, 220);
  const message = sanitizeText(req.body?.message, 4000);
  const productId = req.body?.product_id ? Number(req.body.product_id) : null;

  if (!name || name.length < 2) {
    res.status(400).json({ error: 'Please provide your full name.' });
    return;
  }
  if (!isValidEmail(email)) {
    res.status(400).json({ error: 'Please provide a valid email address.' });
    return;
  }
  if (!subject || subject.length < 3) {
    res.status(400).json({ error: 'Please provide an enquiry subject.' });
    return;
  }
  if (!message || message.length < 10) {
    res.status(400).json({ error: 'Message must be at least 10 characters long.' });
    return;
  }

  let validProductId: number | null = null;
  if (productId && Number.isInteger(productId) && productId > 0) {
    const prod = db.prepare('SELECT id FROM products WHERE id = ?').get(productId);
    if (prod) validProductId = productId;
  }

  const refCode = `ENQ-${new Date().getFullYear()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

  const info = db
    .prepare(`
      INSERT INTO enquiries (reference_code, name, email, phone, company, subject, product_id, message, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `)
    .run(refCode, name, email, phone, company, subject, validProductId, message);

  const id = Number(info.lastInsertRowid);

  logAudit({
    userEmail: email,
    action: 'ENQUIRY_SUBMITTED',
    entityType: 'enquiry',
    entityId: id,
    details: `Public enquiry ${refCode} submitted: "${subject}".`,
    ipAddress: ip,
  });

  res.status(201).json({
    message: 'Your enquiry has been received by Casid Pharma.',
    reference_code: refCode,
    enquiry_id: id,
  });
}

export function listEnquiries(req: AuthenticatedRequest, res: Response): void {
  const db = getDb();
  const status = typeof req.query.status === 'string' ? req.query.status.trim() : '';
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';

  const where: string[] = [];
  const params: unknown[] = [];

  if (status && status !== 'all') {
    where.push('e.status = ?');
    params.push(status);
  }
  if (search) {
    where.push('(e.reference_code LIKE ? OR e.name LIKE ? OR e.email LIKE ? OR e.subject LIKE ? OR e.company LIKE ?)');
    const like = `%${search}%`;
    params.push(like, like, like, like, like);
  }

  const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
  const rows = db
    .prepare(`
      SELECT e.*, p.name as product_name, u.name as reviewed_by_name
      FROM enquiries e
      LEFT JOIN products p ON e.product_id = p.id
      LEFT JOIN users u ON e.reviewed_by = u.id
      ${whereSql}
      ORDER BY e.created_at DESC, e.id DESC
    `)
    .all(...params);

  res.json({ enquiries: rows });
}

export function updateEnquiry(req: AuthenticatedRequest, res: Response): void {
  const db = getDb();
  const id = Number(req.params.id);
  const ip = extractClientIp(req);

  const existing = db.prepare('SELECT * FROM enquiries WHERE id = ?').get(id) as Record<string, unknown> | undefined;
  if (!existing) {
    res.status(404).json({ error: 'Enquiry record not found.' });
    return;
  }

  const nextStatus = sanitizeText(req.body?.status ?? existing.status, 30);
  if (!['pending', 'reviewed', 'responded', 'closed'].includes(nextStatus)) {
    res.status(400).json({ error: 'Invalid enquiry status.' });
    return;
  }
  const adminNotes = sanitizeText(req.body?.admin_notes ?? existing.admin_notes, 2000);

  db.prepare(`
    UPDATE enquiries SET
      status = ?, admin_notes = ?, reviewed_by = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(nextStatus, adminNotes, req.user?.id ?? null, id);

  const updated = db
    .prepare(`
      SELECT e.*, p.name as product_name, u.name as reviewed_by_name
      FROM enquiries e
      LEFT JOIN products p ON e.product_id = p.id
      LEFT JOIN users u ON e.reviewed_by = u.id
      WHERE e.id = ?
    `)
    .get(id);

  logAudit({
    userId: req.user?.id,
    userEmail: req.user?.email,
    action: 'ENQUIRY_UPDATED',
    entityType: 'enquiry',
    entityId: id,
    details: `Updated enquiry ${existing.reference_code} status to "${nextStatus}".`,
    ipAddress: ip,
  });

  res.json({ enquiry: updated });
}

export function deleteEnquiry(req: AuthenticatedRequest, res: Response): void {
  const db = getDb();
  const id = Number(req.params.id);
  const ip = extractClientIp(req);

  const existing = db.prepare('SELECT id, reference_code FROM enquiries WHERE id = ?').get(id) as
    | { id: number; reference_code: string }
    | undefined;
  if (!existing) {
    res.status(404).json({ error: 'Enquiry record not found.' });
    return;
  }

  db.prepare('DELETE FROM enquiries WHERE id = ?').run(id);

  logAudit({
    userId: req.user?.id,
    userEmail: req.user?.email,
    action: 'ENQUIRY_DELETED',
    entityType: 'enquiry',
    entityId: id,
    details: `Deleted enquiry ${existing.reference_code} per retention policy.`,
    ipAddress: ip,
  });

  res.json({ message: 'Enquiry record deleted successfully.' });
}
