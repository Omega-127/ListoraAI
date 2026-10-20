import { Router } from 'express';
import { getAllListings, refreshAllListings } from '../services/listing.service';
import { detectAllMismatches } from '../services/mismatch.service';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const listings = await getAllListings();
    res.json(listings);
  } catch (err) {
    next(err);
  }
});

router.post('/refresh', async (_req, res, next) => {
  try {
    const listings = await refreshAllListings();
    // After refreshing listings, re-run mismatch detection
    const mismatches = await detectAllMismatches();
    res.json({ listings, mismatchesDetected: mismatches.length });
  } catch (err) {
    next(err);
  }
});

export default router;
