import { Router } from 'express';
import { getAuditLog } from '../services/audit.service';
import { z } from 'zod';
import { validate } from '../middleware/validate';

const router = Router();

const QuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
  eventType: z.string().optional(),
});

router.get('/', validate({ query: QuerySchema }), async (req, res, next) => {
  try {
    const result = await getAuditLog(req.query as z.infer<typeof QuerySchema>);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
