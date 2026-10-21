/**
 * Zod request validation middleware factory.
 *
 * Usage:
 *   router.put('/', validate({ body: MySchema }), controller);
 */
import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

interface ValidationTargets {
  body?: z.ZodTypeAny;
  params?: z.ZodTypeAny;
  query?: z.ZodTypeAny;
}

export function validate(schemas: ValidationTargets) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (schemas.body) req.body = schemas.body.parse(req.body);
      if (schemas.params) req.params = schemas.params.parse(req.params);
      if (schemas.query) req.query = schemas.query.parse(req.query);
      next();
    } catch (err) {
      next(err);
    }
  };
}
