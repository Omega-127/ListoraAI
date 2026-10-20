/**
 * requireAuth middleware.
 * Verifies the HttpOnly session cookie containing a signed JWT.
 * Attaches req.user on success; returns 401 otherwise.
 */
import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

interface SessionPayload {
  email: string;
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
    req.user = { email: payload.email };
    next();
  } catch {
    res.status(401).json({ error: 'Session expired or invalid. Please log in again.' });
  }
}
