import bcrypt from 'bcryptjs';
import type { Request, Response } from 'express';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { getDb } from '../config/db';
import { env } from '../config/env';
import type { AuthenticatedRequest, UserRole } from '../middleware/authMiddleware';
import { extractClientIp, logAudit } from '../services/auditService';
import { isValidEmail, sanitizeText, validateStrongPassword } from '../services/sanitizeService';

function signSessionToken(user: { id: number; email: string; role: UserRole }): string {
  const options: SignOptions = {
    expiresIn: env.jwtExpiresIn as SignOptions['expiresIn'],
  };
  return jwt.sign({ sub: user.id, email: user.email, role: user.role }, env.jwtSecret, options);
}

function setAuthCookie(res: Response, token: string): void {
  res.cookie('casid_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.nodeEnv === 'production',
    maxAge: 8 * 60 * 60 * 1000,
    path: '/',
  });
}

export function getSetupStatus(_req: Request, res: Response): void {
  const db = getDb();
  const row = db
    .prepare("SELECT COUNT(*) as count FROM users WHERE role = 'super_admin' AND status = 'active'")
    .get() as { count: number };

  res.json({
    needsInitialSetup: row.count === 0,
    designatedEmail: env.initialAdminEmail,
  });
}

export function setupInitialAdmin(req: Request, res: Response): void {
  const db = getDb();
  const ip = extractClientIp(req);

  const existingSuperAdmin = db
    .prepare("SELECT id FROM users WHERE role = 'super_admin'")
    .get() as { id: number } | undefined;

  if (existingSuperAdmin) {
    res.status(409).json({
      error: 'Initial Super Admin is already provisioned. Public setup is permanently locked.',
    });
    return;
  }

  const name = sanitizeText(req.body?.name, 120);
  const email = sanitizeText(req.body?.email, 180).toLowerCase();
  const password = typeof req.body?.password === 'string' ? req.body.password : '';

  if (!name || name.length < 2) {
    res.status(400).json({ error: 'Administrator full name is required.' });
    return;
  }
  if (!isValidEmail(email) || email !== env.initialAdminEmail) {
    logAudit({
      userEmail: email || 'unknown',
      action: 'INITIAL_SETUP_REJECTED',
      entityType: 'user',
      details: `Unauthorized initial setup attempt for non-designated email: ${email}`,
      ipAddress: ip,
    });
    res.status(403).json({
      error: `Only the designated initial administrator email (${env.initialAdminEmail}) can complete initial setup.`,
    });
    return;
  }

  const pwCheck = validateStrongPassword(password);
  if (!pwCheck.valid) {
    res.status(400).json({ error: pwCheck.message });
    return;
  }

  const passwordHash = bcrypt.hashSync(password, 12);

  const insertTx = db.transaction(() => {
    // Re-check inside transaction for strict idempotency
    const doubleCheck = db.prepare("SELECT id FROM users WHERE role = 'super_admin'").get();
    if (doubleCheck) {
      throw new Error('ALREADY_PROVISIONED');
    }

    const result = db
      .prepare(`
        INSERT INTO users (name, email, password_hash, role, status, last_login_at)
        VALUES (?, ?, ?, 'super_admin', 'active', datetime('now'))
      `)
      .run(name, email, passwordHash);

    return Number(result.lastInsertRowid);
  });

  try {
    const userId = insertTx();
    const user = { id: userId, name, email, role: 'super_admin' as UserRole };
    const token = signSessionToken(user);
    setAuthCookie(res, token);

    logAudit({
      userId,
      userEmail: email,
      action: 'INITIAL_SUPER_ADMIN_PROVISIONED',
      entityType: 'user',
      entityId: userId,
      details: `Designated Super Admin account (${email}) verified and activated.`,
      ipAddress: ip,
    });

    res.status(201).json({
      message: 'Initial Super Admin account provisioned successfully.',
      token,
      user: { id: userId, name, email, role: 'super_admin', status: 'active' },
    });
  } catch (err) {
    if (err instanceof Error && err.message === 'ALREADY_PROVISIONED') {
      res.status(409).json({ error: 'Initial Super Admin is already provisioned.' });
      return;
    }
    console.error('[Auth] Initial setup failed:', err);
    res.status(500).json({ error: 'Failed to provision initial administrator.' });
  }
}

export function login(req: Request, res: Response): void {
  const email = sanitizeText(req.body?.email, 180).toLowerCase();
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  const ip = extractClientIp(req);

  if (!isValidEmail(email) || !password) {
    res.status(400).json({ error: 'Valid email and password are required.' });
    return;
  }

  const db = getDb();
  const user = db
    .prepare('SELECT id, name, email, password_hash, role, status FROM users WHERE email = ?')
    .get(email) as
    | {
        id: number;
        name: string;
        email: string;
        password_hash: string;
        role: UserRole;
        status: string;
      }
    | undefined;

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    logAudit({
      userId: user?.id ?? null,
      userEmail: email,
      action: 'ADMIN_LOGIN_FAILED',
      entityType: 'auth',
      details: 'Invalid email or password presented.',
      ipAddress: ip,
    });
    res.status(401).json({ error: 'Invalid email or password.' });
    return;
  }

  if (user.status !== 'active') {
    logAudit({
      userId: user.id,
      userEmail: user.email,
      action: 'ADMIN_LOGIN_BLOCKED',
      entityType: 'auth',
      details: 'Inactive administrator attempted login.',
      ipAddress: ip,
    });
    res.status(403).json({ error: 'Your administrator account is inactive. Contact a Super Admin.' });
    return;
  }

  db.prepare("UPDATE users SET last_login_at = datetime('now'), updated_at = datetime('now') WHERE id = ?").run(user.id);

  const token = signSessionToken({ id: user.id, email: user.email, role: user.role });
  setAuthCookie(res, token);

  logAudit({
    userId: user.id,
    userEmail: user.email,
    action: 'ADMIN_LOGIN_SUCCESS',
    entityType: 'auth',
    entityId: user.id,
    details: `Signed in with role ${user.role}.`,
    ipAddress: ip,
  });

  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
    },
  });
}

export function logout(req: AuthenticatedRequest, res: Response): void {
  const ip = extractClientIp(req);
  if (req.user) {
    logAudit({
      userId: req.user.id,
      userEmail: req.user.email,
      action: 'ADMIN_LOGOUT',
      entityType: 'auth',
      entityId: req.user.id,
      details: 'Administrator signed out.',
      ipAddress: ip,
    });
  }
  res.clearCookie('casid_token', { path: '/' });
  res.json({ message: 'Signed out successfully.' });
}

export function getMe(req: AuthenticatedRequest, res: Response): void {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated.' });
    return;
  }
  const db = getDb();
  const profile = db
    .prepare('SELECT id, name, email, role, status, last_login_at, created_at FROM users WHERE id = ?')
    .get(req.user.id);
  res.json({ user: profile });
}
