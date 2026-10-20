/**
 * Authentication and Role-based Authorization middleware.
 * Verifies HttpOnly JWT session cookie and enforces role permissions (ADMIN, OPERATOR, VIEWER).
 */
import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import type { UserRole } from '@bizlisting/shared';

export interface SessionPayload {
  id?: string;
  email: string;
  name?: string | null;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token: string | undefined = req.cookies?.session;

  if (!token) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  try {
    const payload = jwt.verify(token, env.SESSION_SECRET) as SessionPayload;
    req.user = {
      id: payload.id,
      email: payload.email,
      name: payload.name,
      role: payload.role || 'OPERATOR',
    };
    next();
  } catch {
    res.status(401).json({ error: 'Session expired or invalid. Please log in again.' });
  }
}

/**
 * Enforces role-based access control.
 * Must be used after requireAuth.
 *
 * Example: router.post('/approve', requireAuth, requireRole('ADMIN', 'OPERATOR'), handler);
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: `Forbidden: role '${req.user.role}' has insufficient permissions for this operation.`,
        requiredRoles: allowedRoles,
        currentRole: req.user.role,
      });
      return;
    }

    next();
  };
}
