/**
 * Tool: compareFields
 * Runs normalization for a single field and returns the comparison result.
 * Read-only — no writes.
 */
import { z } from 'zod';
import { phonesMatch } from '../../normalization/phone';
import { textsMatch } from '../../normalization/text';
import { hoursMatch } from '../../normalization/hours';

export const compareFieldsToolDefinition = {
  name: 'compareFields',
  description:
    'Compares a profile value against a listing value for one field. Returns whether they match after normalization.',
  input_schema: {
    type: 'object' as const,
    properties: {
      field: { type: 'string', description: 'Field name: name | address | phone | regularHours | holidayHours' },
      profileValue: { description: 'The approved profile value' },
      listingValue: { description: 'The listing value to compare' },
    },
    required: ['field', 'profileValue', 'listingValue'],
  },
};

const InputSchema = z.object({
  field: z.string(),
  profileValue: z.unknown(),
  listingValue: z.unknown(),
});

export function executeCompareFields(input: unknown): unknown {
  const { field, profileValue, listingValue } = InputSchema.parse(input);

  let match = false;
  let method = 'exact';

  if (field === 'phone') {
    match = phonesMatch(String(profileValue), String(listingValue));
    method = 'E.164 phone normalization';
  } else if (field === 'regularHours' || field === 'holidayHours') {
    match = hoursMatch(
      profileValue as Record<string, string>,
      listingValue as Record<string, string>,
    );
    method = 'hours normalization (24h canonical)';
  } else {
    match = textsMatch(String(profileValue), String(listingValue));
    method = 'text normalization (lowercase, abbreviation expansion)';
  }

  return { field, match, method, profileValue, listingValue };
}
