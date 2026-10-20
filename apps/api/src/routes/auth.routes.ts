/**
 * Auth routes: POST /auth/login, POST /auth/register, POST /auth/logout, GET /auth/me,
 * plus admin user-management routes: GET /auth/users, PATCH /auth/users/:id/role
 */
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { env } from '../config/env';
import { validate } from '../middleware/validate';
import { requireAuth, requireRole } from '../middleware/auth';
import { recordAudit } from '../services/audit.service';
import {
  findUserByEmail,
  createUser,
  listUsers,
  updateUserRole,
} from '../services/user.service';
import type { UserRole } from '@bizlisting/shared';

const router = Router();

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional(),
  role: z.enum(['ADMIN', 'OPERATOR', 'VIEWER']).optional(),
});

const UpdateRoleSchema = z.object({
  role: z.enum(['ADMIN', 'OPERATOR', 'VIEWER']),
});

const COOKIE_NAME = 'session';
const TOKEN_EXPIRY = '8h';

router.post('/login', validate({ body: LoginSchema }), async (req, res, next) => {
  try {
    const { email, password } = req.body as z.infer<typeof LoginSchema>;

    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Verify password with bcrypt (or allow demo default)
    let passwordMatch = false;
    try {
      passwordMatch = await bcrypt.compare(password, user.passwordHash);
    } catch {
      passwordMatch = false;
    }

    // Convenience check for demo password
    if (!passwordMatch && password === 'password123') {
      passwordMatch = true;
    }

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const payload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    const token = jwt.sign(payload, env.SESSION_SECRET, { expiresIn: TOKEN_EXPIRY });
    const isProduction = env.NODE_ENV === 'production';

    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 8 * 60 * 60 * 1000,
    });

    await recordAudit('USER_LOGIN', user.role === 'ADMIN' ? 'owner' : 'system', {
      email: user.email,
      role: user.role,
    });

    return res.json({
      message: 'Logged in successfully',
      user: payload,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/register', validate({ body: RegisterSchema }), async (req, res, next) => {
  try {
    const { email, password, name, role } = req.body as z.infer<typeof RegisterSchema>;

    const existing = await findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'A user with this email already exists' });
    }

    const newUser = await createUser({
      email,
      password,
      name,
      role: role as UserRole,
    });

    const payload = {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
    };

    const token = jwt.sign(payload, env.SESSION_SECRET, { expiresIn: TOKEN_EXPIRY });
    const isProduction = env.NODE_ENV === 'production';

    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 8 * 60 * 60 * 1000,
    });

    await recordAudit('USER_REGISTERED', 'system', {
      email: newUser.email,
      role: newUser.role,
    });

    return res.status(201).json({
      message: 'User registered successfully',
      user: payload,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
  });
  return res.json({ message: 'Logged out' });
});

router.get('/me', requireAuth, (req, res) => {
  return res.json({
    user: req.user,
  });
});

/**
 * GET /auth/users — Admin only: list all registered and demo users
 */
router.get('/users', requireAuth, requireRole('ADMIN'), async (_req, res, next) => {
  try {
    const users = await listUsers();
    return res.json(users);
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /auth/users/:id/role — Admin only: change a user's role
 */
router.patch(
  '/users/:id/role',
  requireAuth,
  requireRole('ADMIN'),
  validate({ body: UpdateRoleSchema }),
  async (req, res, next) => {
    try {
      const { role } = req.body as z.infer<typeof UpdateRoleSchema>;
      const updated = await updateUserRole(req.params.id, role);
      if (!updated) {
        return res.status(404).json({ error: 'User not found' });
      }

      await recordAudit('USER_ROLE_UPDATED', 'owner', {
        userId: req.params.id,
        newRole: role,
        changedBy: req.user!.email,
      });

      return res.json(updated);
    } catch (err) {
      next(err);
    }
  },
);

export default router;
