import { Router } from 'express';
import { getMismatches, getMismatchById } from '../services/mismatch.service';
import type { MismatchKind } from '@bizlisting/shared';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const { kind, resolved } = req.query;
    const mismatches = await getMismatches({
      kind: kind as MismatchKind | undefined,
      resolved: resolved === 'true' ? true : resolved === 'false' ? false : undefined,
    });
    res.json(mismatches);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const mismatch = await getMismatchById(req.params.id);
    if (!mismatch) {
      res.status(404).json({ error: 'Mismatch not found' });
      return;
    }
    res.json(mismatch);
  } catch (err) {
    next(err);
  }
});

export default router;
