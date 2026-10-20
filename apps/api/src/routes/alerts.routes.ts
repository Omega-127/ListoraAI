import { Router } from 'express';
import { getAlerts } from '../services/alert.service';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const alerts = await getAlerts();
    res.json(alerts);
  } catch (err) {
    next(err);
  }
});

export default router;
