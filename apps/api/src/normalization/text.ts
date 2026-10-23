/**
 * Text normalization for business name and address comparison.
 * Goal: eliminate harmless formatting differences so they don't generate false mismatches.
 *
 * Rules applied (in order):
 *  1. Lowercase
 *  2. Trim leading/trailing whitespace
 *  3. Collapse internal whitespace to a single space
 *  4. Normalize common address abbreviations to their full forms
 *  5. Remove punctuation except alphanumeric, space, comma, and hyphen
 */

const ABBREVIATIONS: Record<string, string> = {
  '\\bst\\b\\.?': 'street',
  '\\bave\\b\\.?': 'avenue',
  '\\bblvd\\b\\.?': 'boulevard',
  '\\bdr\\b\\.?': 'drive',
  '\\brd\\b\\.?': 'road',
  '\\bct\\b\\.?': 'court',
  '\\bpl\\b\\.?': 'place',
  '\\bln\\b\\.?': 'lane',
  '\\bhwy\\b\\.?': 'highway',
  '\\bpkwy\\b\\.?': 'parkway',
  '\\bsq\\b\\.?': 'square',
  '\\bfte\\b\\.?': 'suite',
  '\\bste\\b\\.?': 'suite',
  '\\bn\\b\\.?': 'north',
  '\\bs\\b\\.?': 'south',
  '\\be\\b\\.?': 'east',
  '\\bw\\b\\.?': 'west',
  // state abbreviation pairs
  '\\bil\\b': 'illinois',
  '\\bca\\b': 'california',
  '\\bny\\b': 'new york',
  '\\btx\\b': 'texas',
  '\\bfl\\b': 'florida',
  '\\bwa\\b': 'washington',
  // Indian address & state abbreviations
  '\\bbangalore\\b': 'bengaluru',
  '\\bka\\b': 'karnataka',
  '\\bmh\\b': 'maharashtra',
  '\\bdl\\b': 'delhi',
  '\\btn\\b': 'tamil nadu',
  '\\bts\\b': 'telangana',
  '\\bcr\\b\\.?': 'cross',
  '\\bmn\\b\\.?': 'main',
  '\\blyt\\b\\.?': 'layout',
  '\\bsec\\b\\.?': 'sector',
  '\\bextn\\b\\.?': 'extension',
  '\\bext\\b\\.?': 'extension',
  '\\bflr\\b\\.?': 'floor',
  '\\bgrnd\\b\\.?': 'ground',
  '\\bblk\\b\\.?': 'block',
  // cafe / café
  'caf[eé]': 'cafe',
  // ampersand
  '&': 'and',
};

/**
 * Normalizes text for equality comparison.
 */
export function normalizeText(raw: string): string {
  if (!raw || typeof raw !== 'string') return '';

  let s = raw.toLowerCase().trim();

  // Expand common abbreviations
  for (const [pattern, replacement] of Object.entries(ABBREVIATIONS)) {
    s = s.replace(new RegExp(pattern, 'gi'), replacement);
  }

  // Remove punctuation that isn't alphanumeric, space, comma, or hyphen
  s = s.replace(/[^a-z0-9 ,\-]/g, ' ');

  // Collapse whitespace
  s = s.replace(/\s+/g, ' ').trim();

  return s;
}

/**
 * Returns true if two text strings refer to the same value after normalization.
 */
export function textsMatch(a: string, b: string): boolean {
  return normalizeText(a) === normalizeText(b);
}
