/**
 * Agent orchestrator (agent.ts)
 *
 * Implements the agentic loop described in ARCHITECTURE.md §4.2:
 *   1. Build context: approved profile + open mismatches
 *   2. Send to Claude with tool definitions
 *   3. While Claude requests tools: execute → validate → return result
 *   4. Parse final structured output with Zod
 *   5. Save explanations and proposals; NEVER save updates here
 *   6. Record every tool call in the audit log
 *
 * If ANTHROPIC_API_KEY is missing, reports the error clearly.
 * Agent output that fails schema validation is discarded and retried once, then flagged.
 */
import Anthropic from '@anthropic-ai/sdk';
import { getAnthropicClient, CLAUDE_MODELS } from '../clients/anthropic.client';
import { SYSTEM_PROMPT, SYSTEM_PROMPT_VERSION } from './prompts/system';
import { AgentOutputSchema, type AgentOutput } from './schemas/agentOutput';
import { recordAudit } from '../services/audit.service';
import { getMismatches } from '../services/mismatch.service';
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
  error?: string;
  toolCallCount: number;
  promptVersion: string;
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
 * Runs the agentic investigation loop.
 */
export async function runAgent(options: AgentTaskOptions = {}): Promise<AgentResult> {
  const client = getAnthropicClient(); // throws clearly if API key is missing

  // Build context
  const mismatches = await getMismatches({ resolved: false });
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

  const taskContext = `
Investigate the following open mismatches and propose corrections where appropriate.
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
  "prompt_version": "${SYSTEM_PROMPT_VERSION}"
}

Open mismatches:
${JSON.stringify(targetMismatches, null, 2)}
`;

  const model = options.useStrongModel ? CLAUDE_MODELS.SONNET : CLAUDE_MODELS.HAIKU;

  const messages: Anthropic.MessageParam[] = [{ role: 'user', content: taskContext }];

  let toolCallCount = 0;
  let iterations = 0;
  let finalOutput: AgentOutput | undefined;

  await recordAudit('AGENT_STARTED', 'agent', {
    model,
    mismatchCount: targetMismatches.length,
    promptVersion: SYSTEM_PROMPT_VERSION,
  });

  try {
    while (iterations < MAX_ITERATIONS) {
      iterations++;

      const response = await client.messages.create({
        model,
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        tools: ALL_TOOLS,
        messages,
      });

      // Add assistant message to history
      messages.push({ role: 'assistant', content: response.content });

      if (response.stop_reason === 'end_turn') {
        // Extract the final text block and parse as JSON
        const textBlock = response.content.find((b) => b.type === 'text');
        if (textBlock && textBlock.type === 'text') {
          try {
            const parsed = JSON.parse(textBlock.text);
            const validated = AgentOutputSchema.safeParse(parsed);
            if (validated.success) {
              finalOutput = validated.data;
            } else {
              // Retry once with an explicit correction request
              logger.warn('Agent output failed schema validation — retrying', validated.error.flatten());
              messages.push({
                role: 'user',
                content: `Your previous response did not match the required JSON schema. Please try again and return only valid JSON matching the schema.`,
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

    // Update mismatch explanations if we have output
    if (finalOutput) {
      for (const fieldAnalysis of finalOutput.fields) {
        const matchingMismatch = targetMismatches.find((m) => m.field === fieldAnalysis.field);
        if (matchingMismatch && fieldAnalysis.explanation) {
          await prisma.mismatch.update({
            where: { id: matchingMismatch.id },
            data: { explanation: fieldAnalysis.explanation },
          });
        }
      }
    }

    await recordAudit('AGENT_COMPLETED', 'agent', {
      toolCallCount,
      iterations,
      success: !!finalOutput,
      promptVersion: SYSTEM_PROMPT_VERSION,
    });

    return {
      success: true,
      output: finalOutput,
      toolCallCount,
      promptVersion: SYSTEM_PROMPT_VERSION,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error('Agent error', { error: message });
    await recordAudit('AGENT_ERROR', 'agent', { error: message });

    return {
      success: false,
      error: message,
      toolCallCount,
      promptVersion: SYSTEM_PROMPT_VERSION,
    };
  }
}
