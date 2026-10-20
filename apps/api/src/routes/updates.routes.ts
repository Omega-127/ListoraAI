import { Router } from 'express';
import { applyAllApprovedProposals, applyProposal, getUpdateResults } from '../services/update.service';
import { z } from 'zod';
import { validate } from '../middleware/validate';

const router = Router();

const ApplySchema = z.object({
  proposalId: z.string().uuid().optional(),
});

/** POST /api/v1/updates — apply approved proposals */
router.post('/', validate({ body: ApplySchema }), async (req, res, next) => {
  try {
    const { proposalId } = req.body as z.infer<typeof ApplySchema>;

    if (proposalId) {
      const result = await applyProposal(proposalId);
      return res.json(result);
    }

    const results = await applyAllApprovedProposals();
    return res.json(results);
  } catch (err) {
    next(err);
  }
});

/** GET /api/v1/updates — list update results */
router.get('/', async (_req, res, next) => {
  try {
    const results = await getUpdateResults();
    res.json(results);
  } catch (err) {
    next(err);
  }
});

export default router;
