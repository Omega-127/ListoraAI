import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import { getRatingSummary, submitRating } from '../services/rating.service';

const router = Router();

const SubmitReviewSchema = z.object({
  authorName: z.string().min(2, 'Name must be at least 2 characters'),
  authorEmail: z.string().email().optional().or(z.literal('')),
  rating: z.number().int().min(1).max(5),
  accuracyScore: z.number().int().min(1).max(5).optional(),
  reliabilityScore: z.number().int().min(1).max(5).optional(),
  comment: z.string().min(5, 'Review comment must be at least 5 characters'),
});

/**
 * GET /api/v1/ratings
 * Public endpoint to fetch rating summary, breakdown, and verified reviews
 */
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const summary = await getRatingSummary();
    res.json(summary);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/ratings/publicity
 * Public endpoint for owner publicity assets, embed snippet, and badges
 */
router.get('/publicity', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const summary = await getRatingSummary();
    res.json(summary.publicity);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/ratings
 * Public submission of customer/viewer ratings with instant score impact feedback
 */
router.post(
  '/',
  validate({ body: SubmitReviewSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await submitRating(req.body);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  },
);

export default router;
