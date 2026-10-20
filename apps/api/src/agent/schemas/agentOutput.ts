/**
 * Zod schemas for validating structured Claude agent output.
 */
import { z } from 'zod';

export const MismatchKindSchema = z.enum(['MISSING', 'OUTDATED', 'CONFLICTING', 'NEEDS_REVIEW', 'OK']);

export const FieldAnalysisSchema = z.object({
  field: z.string(),
  mismatch_kind: MismatchKindSchema,
  explanation: z.string().max(500),
  proposed_value: z.unknown().optional(),
  confidence: z.enum(['high', 'medium', 'low']),
});

export const AgentOutputSchema = z.object({
  summary: z.string().max(1000),
  fields: z.array(FieldAnalysisSchema),
  requires_human_review: z.boolean(),
  prompt_version: z.string(),
});

export type AgentOutput = z.infer<typeof AgentOutputSchema>;
export type FieldAnalysis = z.infer<typeof FieldAnalysisSchema>;
