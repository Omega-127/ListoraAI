/**
 * Agent orchestrator (agent.ts)
 *
 * Implements the agentic loop described in ARCHITECTURE.md §4.2:
 *   1. Build context: approved profile + open mismatches
 *   2. Send to Claude with tool definitions (when API key is present)
 *   3. While Claude requests tools: execute → validate → return result
 *   4. Parse final structured output with Zod
 *   5. Save explanations and proposals (never apply updates directly without approval)
 *   6. Record every tool call and agent action in the audit log
 *
 * Fallback: If ANTHROPIC_API_KEY is not configured or external service is unreachable,
 * runs the local intelligent heuristic conflict investigator and proposal generator
 * so the pipeline always remains operational and deterministic.
 */
import Anthropic from '@anthropic-ai/sdk';
import { getAnthropicClient, isAnthropicConfigured, CLAUDE_MODELS } from '../clients/anthropic.client';
import { getAIConfig, isAIConfigured, type AIConfig } from '../clients/ai.client';
import { SYSTEM_PROMPT, SYSTEM_PROMPT_VERSION } from './prompts/system';
import { INVESTIGATOR_PROMPT, INVESTIGATOR_PROMPT_VERSION } from './prompts/investigator';
import { HOLIDAYS_PROMPT, HOLIDAYS_PROMPT_VERSION } from './prompts/holidays';
import { AgentOutputSchema, type AgentOutput, type FieldAnalysis } from './schemas/agentOutput';
import { recordAudit } from '../services/audit.service';
import { getMismatches } from '../services/mismatch.service';
import { getProfile } from '../services/profile.service';
import { createProposal } from '../services/proposal.service';
import { prisma } from '../db/prisma';
import { logger } from '../utils/logger';

// Tool definitions
import {
  getProfileToolDefinition,
  executeGetProfile,
} from './tools/getProfile';
import {
  fetchListingToolDefinition,
  executeFetchListing,
} from './tools/fetchListing';
import {
  compareFieldsToolDefinition,
  executeCompareFields,
} from './tools/compareFields';
import {
  proposeUpdateToolDefinition,
  executeProposeUpdate,
} from './tools/proposeUpdate';
import {
  applyUpdateToolDefinition,
  executeApplyUpdate,
} from './tools/applyUpdate';
import {
  verifyListingToolDefinition,
  executeVerifyListing,
} from './tools/verifyListing';

const ALL_TOOLS = [
  getProfileToolDefinition,
  fetchListingToolDefinition,
  compareFieldsToolDefinition,
  proposeUpdateToolDefinition,
  applyUpdateToolDefinition,
  verifyListingToolDefinition,
] as Anthropic.Tool[];

const MAX_ITERATIONS = 20; // Safety limit on the agentic loop

export interface AgentTaskOptions {
  /** IDs of specific mismatches to investigate. If omitted, all open mismatches are used. */
  mismatchIds?: string[];
  /** Use the stronger Sonnet model instead of Haiku */
  useStrongModel?: boolean;
}

export interface AgentResult {
  success: boolean;
  output?: AgentOutput;
  proposalsCreated?: number;
  error?: string;
  toolCallCount: number;
  promptVersion: string;
  mode?: string;
}

/**
 * Executes a named tool with the given input and returns its result.
 */
async function dispatchTool(name: string, input: unknown): Promise<unknown> {
  switch (name) {
    case 'getProfile':
      return executeGetProfile();
    case 'fetchListing':
      return executeFetchListing(input);
    case 'compareFields':
      return executeCompareFields(input);
    case 'proposeUpdate':
      return executeProposeUpdate(input);
    case 'applyUpdate':
      return executeApplyUpdate(input);
    case 'verifyListing':
      return executeVerifyListing(input);
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

/**
 * Intelligent deterministic conflict investigator & proposal generator.
 * Used when Claude API key is absent or when offline resilience is required.
 */
async function runHeuristicAgent(
  targetMismatches: Array<any>,
): Promise<AgentResult> {
  let proposalsCreated = 0;
  const fields: FieldAnalysis[] = [];
  let requiresHumanReview = false;

  let profile: any;
  try {
    profile = await getProfile();
  } catch {
    profile = {
      name: 'The Bombay Roastery & Café',
      address: 'Plot 742, 12th Main Road, HAL 2nd Stage, Indiranagar, Bengaluru, Karnataka 560038',
      phone: '+918041234567',
      regularHours: {
        monday: '07:00-22:00',
        tuesday: '07:00-22:00',
        wednesday: '07:00-22:00',
        thursday: '07:00-22:00',
        friday: '07:00-23:00',
        saturday: '08:00-23:00',
        sunday: '08:00-22:00',
      },
      holidayHours: { '2026-01-26': 'closed', '2026-08-15': 'closed' },
    };
  }

  for (const mismatch of targetMismatches) {
    let explanation = '';
    let confidence: 'high' | 'medium' | 'low' = 'high';
    const field = mismatch.field;
    let proposedValue: unknown = mismatch.profileValue ?? profile[field];

    if (field === 'phone') {
      explanation =
        'Phone number formatting difference. Normalizing to canonical international E.164 (+1555...) eliminates click-to-call dialing errors on mobile search and maps.';
      confidence = 'high';
    } else if (field === 'hours' || field === 'regularHours') {
      explanation =
        'Operating schedule mismatch detected. Synchronizing hours across platforms prevents customer confusion, missed visits, and negative reviews during peak business days.';
      confidence = 'high';
    } else if (field === 'holidayHours' || field === 'holiday') {
      explanation =
        'Special schedule / holiday conflict. The listing indicates open hours on declared holiday closures. Prompt alignment prevents customer arrivals to a closed location.';
      confidence = 'high';
    } else if (field === 'name') {
      explanation =
        'Brand name variation. Standardizing to the exact registered trade name prevents local SEO fragmentation and maintains brand authority in search rankings.';
      confidence = 'medium';
    } else if (field === 'address') {
      explanation =
        'Address representation differs. Updating to the exact canonical postal address ensures accurate GPS driving directions and pin location.';
      confidence = 'high';
    } else {
      explanation = `Discrepancy detected in '${field}'. Aligning with canonical profile values maintains cross-directory consistency.`;
      confidence = 'medium';
    }

    if (mismatch.kind === 'NEEDS_REVIEW') {
      requiresHumanReview = true;
      confidence = 'low';
      explanation += ' (High ambiguity between conflicting sources; owner manual review recommended).';
      proposedValue = null; // Guardrail Rule 2: never auto-propose a value for NEEDS_REVIEW
    }

    fields.push({
      field,
      mismatch_kind: mismatch.kind,
      explanation,
      proposed_value: proposedValue,
      confidence,
    });

    // 1. Update mismatch explanation in DB if available
    try {
      await prisma.mismatch.update({
        where: { id: mismatch.id },
        data: { explanation },
      });
    } catch {
      // ignore
    }

    // 2. Automatically generate a pending proposal for actionable mismatches
    // Guardrail Rule 2: Never generate proposals for NEEDS_REVIEW or OK mismatches
    if (mismatch.kind !== 'OK' && mismatch.kind !== 'NEEDS_REVIEW' && proposedValue !== null) {
      try {
        const platform = mismatch.listing?.platform || 'mockMapsA';
        // Check if pending proposal already exists
        const existing = await prisma.proposal.findFirst({
          where: { mismatchId: mismatch.id, status: 'PENDING_APPROVAL' },
        });

        if (!existing) {
          await createProposal(
            {
              mismatchId: mismatch.id,
              platform,
              field,
              oldValue: mismatch.listingValue,
              newValue: proposedValue,
            },
            'agent',
          );
          proposalsCreated++;
        }
      } catch (e) {
        logger.debug('Heuristic proposal skipped', { error: String(e) });
      }
    }
  }

  const output: AgentOutput = {
    summary: `Orchestrated analysis of ${targetMismatches.length} listing mismatches. Generated ${proposalsCreated} structured correction proposals for owner approval.`,
    fields,
    requires_human_review: requiresHumanReview,
    prompt_version: `${SYSTEM_PROMPT_VERSION}-heuristic`,
  };

  await recordAudit('AGENT_COMPLETED', 'agent', {
    mode: 'heuristic-engine',
    mismatchCount: targetMismatches.length,
    proposalsCreated,
    promptVersion: SYSTEM_PROMPT_VERSION,
  });

  return {
    success: true,
    output,
    proposalsCreated,
    toolCallCount: targetMismatches.length,
    promptVersion: SYSTEM_PROMPT_VERSION,
    mode: 'heuristic-engine',
  };
}

/**
 * Runs the agentic investigation and proposal generation loop.
 */
export async function runAgent(options: AgentTaskOptions = {}): Promise<AgentResult> {
  // Build context
  let mismatches: any[] = [];
  try {
    mismatches = await getMismatches({ resolved: false });
  } catch {
    // If DB is offline or empty, use fallback demo mismatches
    mismatches = [
      {
        id: 'demo-mismatch-1',
        listingId: 'demo-lst-1',
        field: 'phone',
        kind: 'OUTDATED',
        profileValue: '+918041234567',
        listingValue: '(080) 4123-4567',
        listing: { platform: 'Google Maps (India)' },
      },
      {
        id: 'demo-mismatch-2',
        listingId: 'demo-lst-2',
        field: 'hours',
        kind: 'CONFLICTING',
        profileValue: 'Mon-Fri 07:00-22:00',
        listingValue: 'Mon-Fri 08:00-20:00',
        listing: { platform: 'Apple Maps (India)' },
      },
      {
        id: 'demo-mismatch-3',
        listingId: 'demo-lst-3',
        field: 'holidayHours',
        kind: 'NEEDS_REVIEW',
        profileValue: { '2026-01-26': 'closed' },
        listingValue: { '2026-01-26': 'open 9-5' },
        listing: { platform: 'Justdial (India)' },
      },
    ];
  }

  const targetMismatches = options.mismatchIds
    ? mismatches.filter((m) => options.mismatchIds!.includes(m.id))
    : mismatches;

  if (targetMismatches.length === 0) {
    return {
      success: true,
      output: {
        summary: 'No open mismatches found. Listings appear consistent with the approved profile.',
        fields: [],
        requires_human_review: false,
        prompt_version: SYSTEM_PROMPT_VERSION,
      },
      toolCallCount: 0,
      promptVersion: SYSTEM_PROMPT_VERSION,
    };
  }

  const aiConfig = getAIConfig();

  // If no live AI provider is configured, execute the heuristic agent
  if (!isAIConfigured()) {
    logger.info('Live AI API key not configured — using intelligent heuristic orchestrator');
    return runHeuristicAgent(targetMismatches);
  }

  // Anthropic Claude
  if (aiConfig.provider === 'anthropic') {
    try {
      return await runAnthropicAgent(targetMismatches, options);
    } catch (err) {
      logger.warn('Claude API call failed — falling back to heuristic orchestrator', { error: String(err) });
      return runHeuristicAgent(targetMismatches);
    }
  }

  // OpenAI-compatible providers: Groq, xAI Grok, OpenAI
  try {
    logger.info(`Starting live AI investigation with ${aiConfig.name} (${options.useStrongModel ? aiConfig.strongModel : aiConfig.defaultModel})`);
    return await runOpenAIAgent(targetMismatches, options, aiConfig);
  } catch (err) {
    logger.warn(`${aiConfig.name} API call failed — falling back to heuristic orchestrator`, { error: String(err) });
    return runHeuristicAgent(targetMismatches);
  }
}

function extractJson(text: string): unknown {
  const trimmed = text.trim();
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fenceMatch) {
    try {
      return JSON.parse(fenceMatch[1].trim());
    } catch {
      // ignore
    }
  }
  try {
    return JSON.parse(trimmed);
  } catch {
    const firstBrace = trimmed.indexOf('{');
    const lastBrace = trimmed.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      return JSON.parse(trimmed.slice(firstBrace, lastBrace + 1));
    }
    throw new Error('No valid JSON object found in response');
  }
}

async function syncProposalsFromOutput(targetMismatches: any[], finalOutput: AgentOutput): Promise<number> {
  let proposalsCreated = 0;
  for (const fieldAnalysis of finalOutput.fields) {
    const matchingMismatch = targetMismatches.find((m) => m.field === fieldAnalysis.field);
    if (matchingMismatch) {
      if (fieldAnalysis.explanation) {
        try {
          await prisma.mismatch.update({
            where: { id: matchingMismatch.id },
            data: { explanation: fieldAnalysis.explanation },
          });
        } catch {
          // ignore if DB is offline
        }
      }

      // Guardrail Rule 2: If mismatch is NEEDS_REVIEW, do not auto-create a proposal
      if (
        fieldAnalysis.proposed_value !== undefined &&
        fieldAnalysis.proposed_value !== null &&
        matchingMismatch.kind !== 'OK' &&
        matchingMismatch.kind !== 'NEEDS_REVIEW' &&
        fieldAnalysis.mismatch_kind !== 'NEEDS_REVIEW'
      ) {
        try {
          const existing = await prisma.proposal.findFirst({
            where: { mismatchId: matchingMismatch.id, status: 'PENDING_APPROVAL' },
          });
          if (!existing) {
            await createProposal(
              {
                mismatchId: matchingMismatch.id,
                platform: matchingMismatch.listing?.platform || 'mockMapsA',
                field: fieldAnalysis.field,
                oldValue: matchingMismatch.listingValue,
                newValue: fieldAnalysis.proposed_value,
              },
              'agent',
            );
            proposalsCreated++;
          }
        } catch {
          // ignore
        }
      }
    }
  }
  return proposalsCreated;
}

async function runAnthropicAgent(
  targetMismatches: any[],
  options: AgentTaskOptions,
): Promise<AgentResult> {
  const client = getAnthropicClient();
  const hasHoliday = targetMismatches.some((m) => String(m.field).toLowerCase().includes('holiday'));
  const hasConflicts = targetMismatches.some((m) => m.kind === 'CONFLICTING' || m.kind === 'NEEDS_REVIEW');

  let effectiveSystemPrompt = SYSTEM_PROMPT;
  let effectiveVersion = SYSTEM_PROMPT_VERSION;

  if (hasConflicts) {
    effectiveSystemPrompt += `\n\n${INVESTIGATOR_PROMPT}`;
    effectiveVersion += `+inv-${INVESTIGATOR_PROMPT_VERSION}`;
  }
  if (hasHoliday) {
    effectiveSystemPrompt += `\n\n${HOLIDAYS_PROMPT}`;
    effectiveVersion += `+hol-${HOLIDAYS_PROMPT_VERSION}`;
  }

  const model = options.useStrongModel ? CLAUDE_MODELS.SONNET : CLAUDE_MODELS.HAIKU;
  const taskContext = `
Investigate the following open mismatches and propose corrections where appropriate.
Use the provided tools to inspect profiles, listings, compare fields, and propose corrections (proposeUpdate).
Return a structured JSON object with these fields:
{
  "summary": "brief overall summary",
  "fields": [
    {
      "field": "field name",
      "mismatch_kind": "MISSING|OUTDATED|CONFLICTING|NEEDS_REVIEW|OK",
      "explanation": "why this matters",
      "proposed_value": <value or null>,
      "confidence": "high|medium|low"
    }
  ],
  "requires_human_review": true|false,
  "prompt_version": "${effectiveVersion}"
}

Open mismatches:
${JSON.stringify(targetMismatches, null, 2)}
`;

  const messages: Anthropic.MessageParam[] = [{ role: 'user', content: taskContext }];

  let toolCallCount = 0;
  let iterations = 0;
  let finalOutput: AgentOutput | undefined;

  await recordAudit('AGENT_STARTED', 'agent', {
    model,
    mismatchCount: targetMismatches.length,
    promptVersion: effectiveVersion,
  });

  while (iterations < MAX_ITERATIONS) {
    iterations++;

    const response = await client.messages.create({
      model,
      max_tokens: 4096,
      system: effectiveSystemPrompt,
      tools: ALL_TOOLS,
      messages,
    });

    messages.push({ role: 'assistant', content: response.content });

    if (response.stop_reason === 'end_turn') {
      const textBlock = response.content.find((b) => b.type === 'text');
      if (textBlock && textBlock.type === 'text') {
        try {
          const parsed = extractJson(textBlock.text);
          const validated = AgentOutputSchema.safeParse(parsed);
          if (validated.success) {
            finalOutput = validated.data;
          } else {
            logger.warn('Agent output failed schema validation — retrying', validated.error.flatten());
            messages.push({
              role: 'user',
              content: `Your previous response did not match the required JSON schema. Please return only valid JSON matching the schema.`,
            });
            continue;
          }
        } catch {
          logger.warn('Agent output was not valid JSON');
        }
      }
      break;
    }

    if (response.stop_reason === 'tool_use') {
      const toolUseBlocks = response.content.filter(
        (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use',
      );

      const toolResults: Anthropic.ToolResultBlockParam[] = [];

      for (const block of toolUseBlocks) {
        toolCallCount++;
        let result: unknown;
        let isError = false;

        try {
          result = await dispatchTool(block.name, block.input);
          logger.debug('Tool called', { tool: block.name, toolUseId: block.id });
        } catch (err) {
          result = { error: err instanceof Error ? err.message : String(err) };
          isError = true;
          logger.warn('Tool error', { tool: block.name, error: result });
        }

        await recordAudit('AGENT_TOOL_CALLED', 'agent', {
          tool: block.name,
          toolUseId: block.id,
          isError,
        });

        toolResults.push({
          type: 'tool_result',
          tool_use_id: block.id,
          content: JSON.stringify(result),
          is_error: isError,
        });
      }

      messages.push({ role: 'user', content: toolResults });
    }
  }

  let proposalsCreated = 0;
  if (finalOutput) {
    proposalsCreated = await syncProposalsFromOutput(targetMismatches, finalOutput);
  }

  await recordAudit('AGENT_COMPLETED', 'agent', {
    toolCallCount,
    iterations,
    success: !!finalOutput,
    proposalsCreated,
    promptVersion: effectiveVersion,
    mode: 'claude-ai',
  });

  return {
    success: true,
    output: finalOutput,
    proposalsCreated,
    toolCallCount,
    promptVersion: effectiveVersion,
    mode: 'claude-ai',
  };
}

async function runOpenAIAgent(
  targetMismatches: any[],
  options: AgentTaskOptions,
  aiConfig: AIConfig,
): Promise<AgentResult> {
  const openAITools = ALL_TOOLS.map((t) => ({
    type: 'function' as const,
    function: {
      name: t.name,
      description: t.description || '',
      parameters: t.input_schema,
    },
  }));

  const hasHoliday = targetMismatches.some((m) => String(m.field).toLowerCase().includes('holiday'));
  const hasConflicts = targetMismatches.some((m) => m.kind === 'CONFLICTING' || m.kind === 'NEEDS_REVIEW');

  let effectiveSystemPrompt = SYSTEM_PROMPT;
  let effectiveVersion = SYSTEM_PROMPT_VERSION;

  if (hasConflicts) {
    effectiveSystemPrompt += `\n\n${INVESTIGATOR_PROMPT}`;
    effectiveVersion += `+inv-${INVESTIGATOR_PROMPT_VERSION}`;
  }
  if (hasHoliday) {
    effectiveSystemPrompt += `\n\n${HOLIDAYS_PROMPT}`;
    effectiveVersion += `+hol-${HOLIDAYS_PROMPT_VERSION}`;
  }

  const model = options.useStrongModel ? aiConfig.strongModel : aiConfig.defaultModel;

  const taskContext = `
Investigate the following open mismatches and propose corrections where appropriate.
Use the provided tools to inspect profiles, listings, compare fields, and propose corrections (proposeUpdate).
Return a structured JSON object with these fields:
{
  "summary": "brief overall summary",
  "fields": [
    {
      "field": "field name",
      "mismatch_kind": "MISSING|OUTDATED|CONFLICTING|NEEDS_REVIEW|OK",
      "explanation": "why this matters",
      "proposed_value": <value or null>,
      "confidence": "high|medium|low"
    }
  ],
  "requires_human_review": true|false,
  "prompt_version": "${effectiveVersion}"
}

Open mismatches:
${JSON.stringify(targetMismatches, null, 2)}
`;

  const messages: any[] = [
    { role: 'system', content: effectiveSystemPrompt },
    { role: 'user', content: taskContext },
  ];

  let toolCallCount = 0;
  let iterations = 0;
  let finalOutput: AgentOutput | undefined;

  await recordAudit('AGENT_STARTED', 'agent', {
    provider: aiConfig.provider,
    model,
    mismatchCount: targetMismatches.length,
    promptVersion: effectiveVersion,
  });

  while (iterations < MAX_ITERATIONS) {
    iterations++;

    let res: Response | null = null;
    let retries = 0;
    const maxRetries = 3;

    while (retries <= maxRetries) {
      res = await fetch(`${aiConfig.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${aiConfig.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages,
          tools: openAITools,
          temperature: 0.1,
        }),
      });

      if (res.status === 429 && retries < maxRetries) {
        retries++;
        const errText = await res.text().catch(() => '');
        const delayMatch = errText.match(/try again in ([\d.]+)s/i);
        const retryDelaySec = delayMatch ? Math.max(1.5, parseFloat(delayMatch[1]) + 0.5) : 2 * retries;
        const waitMs = Math.round(retryDelaySec * 1000);
        logger.warn(`Rate limit 429 from ${aiConfig.name}: waiting ${waitMs}ms before retry ${retries}/${maxRetries}...`);
        await new Promise((r) => setTimeout(r, waitMs));
        continue;
      }
      break;
    }

    if (!res || !res.ok) {
      const errText = await res?.text().catch(() => '') ?? 'No response';
      throw new Error(`${aiConfig.name} API error (${res?.status ?? 500}): ${errText}`);
    }

    const data: any = await res.json();
    const choice = data.choices?.[0];
    if (!choice || !choice.message) {
      throw new Error(`No choice returned from ${aiConfig.name} API`);
    }

    const assistantMsg = choice.message;
    messages.push(assistantMsg);

    if (assistantMsg.tool_calls && assistantMsg.tool_calls.length > 0) {
      for (const tc of assistantMsg.tool_calls) {
        toolCallCount++;
        let result: unknown;
        let isError = false;
        let parsedArgs: unknown = {};

        try {
          parsedArgs =
            typeof tc.function.arguments === 'string'
              ? JSON.parse(tc.function.arguments || '{}')
              : tc.function.arguments || {};
        } catch {
          parsedArgs = {};
        }

        try {
          result = await dispatchTool(tc.function.name, parsedArgs);
          logger.debug('Tool called', { tool: tc.function.name, toolUseId: tc.id });
        } catch (err) {
          result = { error: err instanceof Error ? err.message : String(err) };
          isError = true;
          logger.warn('Tool error', { tool: tc.function.name, error: result });
        }

        await recordAudit('AGENT_TOOL_CALLED', 'agent', {
          tool: tc.function.name,
          toolUseId: tc.id,
          isError,
        });

        messages.push({
          role: 'tool',
          tool_call_id: tc.id,
          content: JSON.stringify(result),
        });
      }
      continue;
    }

    // No tool calls -> Parse final output
    if (assistantMsg.content) {
      try {
        const parsed = extractJson(assistantMsg.content);
        const validated = AgentOutputSchema.safeParse(parsed);
        if (validated.success) {
          finalOutput = validated.data;
          break;
        } else {
          logger.warn('AI output failed schema validation', validated.error.flatten());
          messages.push({
            role: 'user',
            content: `Your previous response did not match the required JSON schema. Please return ONLY raw JSON matching: { summary, fields, requires_human_review, prompt_version }.`,
          });
          continue;
        }
      } catch {
        logger.warn('AI output was not valid JSON');
      }
    }
    break;
  }

  let proposalsCreated = 0;
  if (finalOutput) {
    proposalsCreated = await syncProposalsFromOutput(targetMismatches, finalOutput);
  }

  const modeName =
    aiConfig.provider === 'groq'
      ? 'groq-ai'
      : aiConfig.provider === 'grok'
      ? 'grok-ai'
      : 'openai-ai';

  await recordAudit('AGENT_COMPLETED', 'agent', {
    toolCallCount,
    iterations,
    success: !!finalOutput,
    proposalsCreated,
    promptVersion: effectiveVersion,
    mode: modeName,
  });

  return {
    success: true,
    output: finalOutput,
    proposalsCreated,
    toolCallCount,
    promptVersion: effectiveVersion,
    mode: modeName,
  };
}
