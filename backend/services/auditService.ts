import type { Request } from 'express';
import { getDb } from '../config/db';

export interface AuditEntry {
  userId?: number | null;
  userEmail?: string;
  action: string;
  entityType: string;
  entityId?: string | number;
  details: string;
  ipAddress?: string;
}

export function extractClientIp(req?: Request): string {
  if (!req) return '127.0.0.1';
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || '127.0.0.1';
}

export function logAudit(entry: AuditEntry): void {
  try {
    const db = getDb();
    db.prepare(`
      INSERT INTO audit_logs (user_id, user_email, action, entity_type, entity_id, details, ip_address)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      entry.userId ?? null,
      entry.userEmail || 'system',
      entry.action,
      entry.entityType,
      String(entry.entityId ?? ''),
      entry.details,
      entry.ipAddress || '127.0.0.1'
    );
  } catch (err) {
    console.error('[AuditLog] Failed to record audit entry:', err);
  }
}
