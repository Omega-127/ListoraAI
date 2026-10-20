import { Router } from 'express';
import { getProfile, updateProfile, ProfileUpdateSchema } from '../services/profile.service';
import { validate } from '../middleware/validate';
import { requireRole } from '../middleware/auth';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const profile = await getProfile();
    res.json(profile);
  } catch (err) {
    next(err);
  }
});

router.put('/', requireRole('ADMIN'), validate({ body: ProfileUpdateSchema }), async (req, res, next) => {
  try {
    const updated = await updateProfile(req.body, req.user!.email);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

export default router;

