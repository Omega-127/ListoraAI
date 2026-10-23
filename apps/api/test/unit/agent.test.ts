import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runAgent } from '../../src/agent/agent';
import { executeCompareFields } from '../../src/agent/tools/compareFields';
import { assertProposalApproved, requiresHumanReview } from '../../src/agent/guardrails';
import { SYSTEM_PROMPT_VERSION } from '../../src/agent/prompts/system';
import { INVESTIGATOR_PROMPT_VERSION } from '../../src/agent/prompts/investigator';
import { HOLIDAYS_PROMPT_VERSION } from '../../src/agent/prompts/holidays';
import { prisma } from '../../src/db/prisma';
import * as aiClient from '../../src/clients/ai.client';

describe('AI Agent Orchestration & Guardrails', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(prisma.auditLog, 'create').mockImplementation(async () => ({} as any));
    vi.spyOn(aiClient, 'isAIConfigured').mockReturnValue(false);
  });

  describe('Agent Tools', () => {
    it('compares phone fields using E.164 normalization', () => {
      const result = executeCompareFields({
        field: 'phone',
        profileValue: '+15550102234',
        listingValue: '(555) 010-2234',
      }) as any;

      expect(result.field).toBe('phone');
      expect(result.match).toBe(true);
      expect(result.method).toContain('phone normalization');
    });

    it('compares text fields normalizing whitespace and abbreviations', () => {
      const result = executeCompareFields({
        field: 'address',
        profileValue: '42 Maple Street, Springfield, IL 62701',
        listingValue: '42 Maple St, Springfield, IL 62701',
      }) as any;

      expect(result.field).toBe('address');
      expect(result.match).toBe(true);
    });

    it('detects genuine mismatch when values differ', () => {
      const result = executeCompareFields({
        field: 'name',
        profileValue: 'Brew & Bloom Café',
        listingValue: 'Completely Different Café',
      }) as any;

      expect(result.match).toBe(false);
    });
  });

  describe('Guardrails', () => {
    it('Rule 1: asserts that proposal must be APPROVED before applying updates', async () => {
      vi.spyOn(prisma.proposal, 'findUnique').mockResolvedValue({
        id: 'prop-test-1',
        status: 'PENDING_APPROVAL',
      } as any);

      await expect(assertProposalApproved('prop-test-1')).rejects.toThrow(
        /must be APPROVED before applying/,
      );
    });

    it('Rule 1: allows applying update when proposal is APPROVED', async () => {
      vi.spyOn(prisma.proposal, 'findUnique').mockResolvedValue({
        id: 'prop-test-2',
        status: 'APPROVED',
      } as any);

      await expect(assertProposalApproved('prop-test-2')).resolves.not.toThrow();
    });

    it('Rule 2: flags conflicts as requiring human review when sources disagree', () => {
      const needsReview = requiresHumanReview('+15550102234', [
        '(555) 010-2234',
        '(555) 999-0000',
      ]);
      expect(needsReview).toBe(true);
    });
  });

  describe('Autonomous Orchestration Engine', () => {
    it('runs autonomous investigation and generates proposals for actionable mismatches', async () => {
      vi.spyOn(prisma.businessProfile, 'findUnique').mockResolvedValue({
        id: 'profile-seed-001',
        name: 'Brew & Bloom Café',
        address: '42 Maple Street',
        phone: '+15550102234',
        regularHours: {},
        holidayHours: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      vi.spyOn(prisma.mismatch, 'findMany').mockResolvedValue([
        {
          id: 'mm-phone',
          listingId: 'lst-1',
          field: 'phone',
          kind: 'OUTDATED',
          profileValue: '+15550102234',
          listingValue: '(555) 010-2234',
          listing: { platform: 'mockMapsA' },
        },
        {
          id: 'mm-conflicting',
          listingId: 'lst-2',
          field: 'hours',
          kind: 'NEEDS_REVIEW',
          profileValue: 'Mon-Fri 08:00-17:00',
          listingValue: 'Mon-Fri 09:00-18:00',
          listing: { platform: 'mockMapsB' },
        },
      ] as any);

      vi.spyOn(prisma.mismatch, 'findUnique').mockImplementation(async ({ where }: any) => ({
        id: where.id,
        listingId: 'lst-1',
        field: 'phone',
        kind: 'OUTDATED',
        profileValue: '+15550102234',
        listingValue: '(555) 010-2234',
        listing: { platform: 'mockMapsA' },
      } as any));

      vi.spyOn(prisma.mismatch, 'update').mockImplementation(async () => ({} as any));
      vi.spyOn(prisma.proposal, 'findFirst').mockResolvedValue(null);
      vi.spyOn(prisma.proposal, 'create').mockImplementation(async (args: any) => ({
        id: 'prop-created',
        ...args.data,
      }));

      const result = await runAgent();

      expect(result.success).toBe(true);
      expect(result.output).toBeDefined();
      expect(result.output?.fields.length).toBe(2);

      // Rule 2: NEEDS_REVIEW mismatch must not have generated an automatic proposal
      const needsReviewField = result.output?.fields.find((f) => f.mismatch_kind === 'NEEDS_REVIEW');
      expect(needsReviewField?.proposed_value).toBeNull();
      expect(result.output?.requires_human_review).toBe(true);

      // Only the OUTDATED mismatch should have a proposal created
      expect(result.proposalsCreated).toBe(1);
    });

    it('returns clean summary when no mismatches exist', async () => {
      vi.spyOn(prisma.mismatch, 'findMany').mockResolvedValue([]);

      const result = await runAgent();

      expect(result.success).toBe(true);
      expect(result.output?.summary).toContain('No open mismatches');
      expect(result.toolCallCount).toBe(0);
    });

    it('tracks prompt versions across system, investigator, and holiday personas', () => {
      expect(SYSTEM_PROMPT_VERSION).toBe('v1.0');
      expect(INVESTIGATOR_PROMPT_VERSION).toBe('v1.0');
      expect(HOLIDAYS_PROMPT_VERSION).toBe('v1.0');
    });
  });
});
