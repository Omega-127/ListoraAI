/**
 * Express type augmentation — adds `user` to the request object
 * once `requireAuth` middleware has verified the session token.
 */
import type { UserRole } from '@bizlisting/shared';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id?: string;
        email: string;
        name?: string | null;
        role: UserRole;
      };
    }
  }
}

export {};
