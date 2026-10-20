import { Router } from 'express';
import {
  getProposals,
  getProposalById,
  approveProposal,
  rejectProposal,
} from '../services/proposal.service';
import { runAgent } from '../agent/agent';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const { status } = req.query;
    const proposals = await getProposals({ status: status as string | undefined });
    res.json(proposals);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const proposal = await getProposalById(req.params.id);
    if (!proposal) return res.status(404).json({ error: 'Proposal not found' });
    return res.json(proposal);
  } catch (err) {
    next(err);
  }
});

router.post('/:id/approve', async (req, res, next) => {
  try {
    const updated = await approveProposal(req.params.id, req.user!.email);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.post('/:id/reject', async (req, res, next) => {
  try {
    const updated = await rejectProposal(req.params.id, req.user!.email);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/proposals/analyze
 * Triggers the AI agent to investigate mismatches and create proposals.
 */
router.post('/analyze', async (req, res, next) => {
  try {
    const { mismatchIds, useStrongModel } = req.body as {
      mismatchIds?: string[];
      useStrongModel?: boolean;
    };
    const result = await runAgent({ mismatchIds, useStrongModel });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
