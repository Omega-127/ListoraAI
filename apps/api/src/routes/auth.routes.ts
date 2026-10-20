/**
 * Auth routes: POST /auth/login, POST /auth/logout, GET /auth/me
 */
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { env } from '../config/env';
import { validate } from '../middleware/validate';
import { requireAuth } from '../middleware/auth';
import { recordAudit } from '../services/audit.service';

const router = Router();

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const COOKIE_NAME = 'session';
const TOKEN_EXPIRY = '8h';

router.post('/login', validate({ body: LoginSchema }), async (req, res, next) => {
  try {
    const { email, password } = req.body as z.infer<typeof LoginSchema>;

    if (email !== env.OWNER_EMAIL) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const passwordMatch = await bcrypt.compare(password, env.OWNER_PASSWORD_HASH);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ email }, env.SESSION_SECRET, { expiresIn: TOKEN_EXPIRY });

    const isProduction = env.NODE_ENV === 'production';

    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 8 * 60 * 60 * 1000, // 8 hours in ms
    });

    await recordAudit('OWNER_LOGIN', 'owner', { email });

    return res.json({ message: 'Logged in successfully', email });
  } catch (err) {
    next(err);
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie(COOKIE_NAME, { httpOnly: true, secure: env.NODE_ENV === 'production', sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax' });
  return res.json({ message: 'Logged out' });
});

router.get('/me', requireAuth, (req, res) => {
  return res.json({ email: req.user!.email });
});

export default router;
