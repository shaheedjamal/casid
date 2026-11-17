import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { getDb } from '../config/db';
import { env } from '../config/env';

export type UserRole = 'super_admin' | 'editor';

export interface AuthenticatedUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  status: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

interface JwtPayload {
  sub: number;
  email: string;
  role: UserRole;
}

function parseCookies(cookieHeader?: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=');
    if (idx > -1) {
      const k = part.slice(0, idx).trim();
      const v = decodeURIComponent(part.slice(idx + 1).trim());
      cookies[k] = v;
    }
  }
  return cookies;
}

export function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  const cookies = parseCookies(req.headers.cookie);
  if (cookies.casid_token) {
    return cookies.casid_token;
  }
  return null;
}

function verifyTokenAndLoadUser(token: string): AuthenticatedUser | null {
  try {
    const decoded = jwt.verify(token, env.jwtSecret) as unknown as JwtPayload;
    const db = getDb();
    const user = db
      .prepare('SELECT id, name, email, role, status FROM users WHERE id = ?')
      .get(decoded.sub) as AuthenticatedUser | undefined;

    if (!user || user.status !== 'active') {
      return null;
    }
    return user;
  } catch {
    return null;
  }
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const token = extractToken(req);
  if (!token) {
    res.status(401).json({ error: 'Authentication required. Please sign in.' });
    return;
  }
  const user = verifyTokenAndLoadUser(token);
  if (!user) {
    res.status(401).json({ error: 'Session invalid or expired. Please sign in again.' });
    return;
  }
  req.user = user;
  next();
}

export function attachOptionalUser(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  const token = extractToken(req);
  if (token) {
    const user = verifyTokenAndLoadUser(token);
    if (user) {
      req.user = user;
    }
  }
  next();
}

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: 'Access denied. Your role does not permit this administrative operation.',
      });
      return;
    }
    next();
  };
}
