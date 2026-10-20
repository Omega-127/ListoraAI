import { describe, it, expect, vi, beforeEach } from 'vitest';
import { requireRole } from '../../src/middleware/auth';
import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../../src/db/prisma';
import { findUserByEmail, listUsers } from '../../src/services/user.service';

describe('Role-Based Access Control (RBAC)', () => {
  beforeEach(() => {
    vi.spyOn(prisma.user, 'findUnique').mockImplementation(async () => null);
    vi.spyOn(prisma.user, 'findMany').mockImplementation(async () => []);
  });

  it('allows access when user has the required role', () => {
    const middleware = requireRole('ADMIN', 'OPERATOR');
    const req = { user: { email: 'admin@listora.ai', role: 'ADMIN' } } as Request;
    const res = {} as Response;
    const next = vi.fn() as unknown as NextFunction;

    middleware(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('rejects access with 403 when user lacks the required role', () => {
    const middleware = requireRole('ADMIN');
    const req = { user: { email: 'viewer@listora.ai', role: 'VIEWER' } } as Request;
    const jsonMock = vi.fn();
    const statusMock = vi.fn().mockReturnValue({ json: jsonMock });
    const res = { status: statusMock } as unknown as Response;
    const next = vi.fn() as unknown as NextFunction;

    middleware(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(statusMock).toHaveBeenCalledWith(403);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.stringContaining("role 'VIEWER' has insufficient permissions"),
      }),
    );
  });

  it('retrieves default demo accounts with respective roles', async () => {
    const admin = await findUserByEmail('admin@listora.ai');
    expect(admin).not.toBeNull();
    expect(admin?.role).toBe('ADMIN');

    const operator = await findUserByEmail('operator@listora.ai');
    expect(operator).not.toBeNull();
    expect(operator?.role).toBe('OPERATOR');

    const viewer = await findUserByEmail('viewer@listora.ai');
    expect(viewer).not.toBeNull();
    expect(viewer?.role).toBe('VIEWER');
  });

  it('lists registered workspace users', async () => {
    const users = await listUsers();
    expect(users.length).toBeGreaterThanOrEqual(3);
    const roles = users.map((u) => u.role);
    expect(roles).toContain('ADMIN');
    expect(roles).toContain('OPERATOR');
    expect(roles).toContain('VIEWER');
  });
});
