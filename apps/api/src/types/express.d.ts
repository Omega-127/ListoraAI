/**
 * Express type augmentation — adds `user` to the request object
 * once `requireAuth` middleware has verified the session token.
 */

declare global {
  namespace Express {
    interface Request {
      user?: {
        email: string;
      };
    }
  }
}

export {};
