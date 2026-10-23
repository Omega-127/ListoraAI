/**
 * Unit tests for proposal lifecycle:
 * - Auto-initialization of demo proposals (prop-1 through prop-5)
 * - Approving proposals
 * - Rejecting proposals
 * - Idempotent repeated approvals
 * - Applying approved proposals to mock platforms
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '../../src/db/prisma';
import {
  getProposals,
  approveProposal,
  rejectProposal,
} from '../../src/services/proposal.service';
import { applyProposal, applyAllApprovedProposals } from '../../src/services/update.service';
import * as mockClient from '../../src/clients/mockPlatform.client';

describe('Proposal Service — approve & reject workflows', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('approves a pending proposal and updates its status in DB', async () => {
    const mockProposal = {
      id: 'prop-1',
      status: 'PENDING_APPROVAL',
      platform: 'mockMapsA',
      field: 'phone',
      newValue: '+15550102234',
    };

    vi.spyOn(prisma.proposal, 'findUnique').mockResolvedValue(mockProposal as any);
    const updateSpy = vi.spyOn(prisma.proposal, 'update').mockResolvedValue({
      ...mockProposal,
      status: 'APPROVED',
      approvedAt: new Date(),
      approvedBy: 'owner',
    } as any);

    const result = await approveProposal('prop-1', 'owner');
    expect(result.status).toBe('APPROVED');
    expect(updateSpy).toHaveBeenCalledWith({
      where: { id: 'prop-1' },
      data: expect.objectContaining({ status: 'APPROVED', approvedBy: 'owner' }),
    });
  });

  it('is idempotent when approving an already approved proposal', async () => {
    const alreadyApproved = {
      id: 'prop-1',
      status: 'APPROVED',
      platform: 'mockMapsA',
      field: 'phone',
      newValue: '+15550102234',
    };

    vi.spyOn(prisma.proposal, 'findUnique').mockResolvedValue(alreadyApproved as any);
    const updateSpy = vi.spyOn(prisma.proposal, 'update');

    const result = await approveProposal('prop-1', 'owner');
    expect(result.status).toBe('APPROVED');
    expect(updateSpy).not.toHaveBeenCalled();
  });

  it('rejects a pending proposal and updates status to REJECTED', async () => {
    const mockProposal = {
      id: 'prop-2',
      status: 'PENDING_APPROVAL',
      platform: 'mockMapsB',
      field: 'regularHours',
    };

    vi.spyOn(prisma.proposal, 'findUnique').mockResolvedValue(mockProposal as any);
    const updateSpy = vi.spyOn(prisma.proposal, 'update').mockResolvedValue({
      ...mockProposal,
      status: 'REJECTED',
      rejectedAt: new Date(),
    } as any);

    const result = await rejectProposal('prop-2', 'owner');
    expect(result.status).toBe('REJECTED');
    expect(updateSpy).toHaveBeenCalledWith({
      where: { id: 'prop-2' },
      data: expect.objectContaining({ status: 'REJECTED' }),
    });
  });
});

describe('Update Service — applying approved proposals', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('applies an approved proposal to its mock platform and saves UpdateResult', async () => {
    const approvedProposal = {
      id: 'prop-1',
      status: 'APPROVED',
      platform: 'mockMapsA',
      field: 'phone',
      newValue: '+15550102234',
      mismatch: {
        listing: { externalId: 'listing_001' },
      },
    };

    vi.spyOn(prisma.proposal, 'findUnique').mockResolvedValue(approvedProposal as any);
    vi.spyOn(mockClient, 'patchListing').mockResolvedValue({
      platform: 'mockMapsA',
      externalId: 'listing_001',
      outcome: 'SUCCESS',
      response: { ok: true },
    });
    vi.spyOn(prisma.updateResult, 'create').mockResolvedValue({
      id: 'res-1',
      proposalId: 'prop-1',
      outcome: 'SUCCESS',
      response: { ok: true },
      createdAt: new Date(),
    } as any);

    const result = await applyProposal('prop-1');
    expect(result.outcome).toBe('SUCCESS');
    expect(mockClient.patchListing).toHaveBeenCalledWith('mockMapsA', 'listing_001', {
      phone: '+15550102234',
    });
  });

  it('rejects applying a proposal that is not APPROVED with a 409 error', async () => {
    const pendingProposal = {
      id: 'prop-2',
      status: 'PENDING_APPROVAL',
      platform: 'mockMapsB',
      field: 'regularHours',
      mismatch: { listing: { externalId: 'listing_002' } },
    };

    vi.spyOn(prisma.proposal, 'findUnique').mockResolvedValue(pendingProposal as any);

    await expect(applyProposal('prop-2')).rejects.toThrow(/must be APPROVED/);
  });
});
