import { Router } from 'express';
import { calculateScore } from '../services/score.service';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const score = await calculateScore();
    res.json(score);
  } catch (err) {
    next(err);
  }
});

export default router;
