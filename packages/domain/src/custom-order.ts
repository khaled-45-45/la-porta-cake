import { z } from 'zod';

import type { DecorationType } from './schemas/designs';
import { decorationTypeSchema } from './schemas/designs';

/**
 * Custom-order inquiries (Phase 6): what a customer may send, how the text is cleaned,
 * and the rules it must meet. Pure: no wording, no framework, no data access. The
 * application layer turns error codes into localized messages and resolves the design.
 *
 * Only fields the shop's data supports are accepted (decision 0005): no sizes or
 * flavour lists are offered, because none are confirmed.
 */

/** Maximum length of each text field, in characters (code points, not bytes). */
export const CUSTOM_ORDER_LIMITS = {
  name: 60,
  description: 500,
  flavour: 80,
  /** As in the prototype: short writing reads clearly on a cake. */
  writing: 40,
  notes: 500,
} as const;

/** How far ahead a requested date may be. */
export const MAX_DAYS_AHEAD = 365;

export type CustomOrderField =
  'occasion' | 'decoration' | 'description' | 'flavour' | 'writing' | 'date' | 'name' | 'notes';

export type CustomOrderErrorCode = 'required' | 'tooLong' | 'invalid' | 'tooSoon' | 'tooFar';

/** A validated inquiry, with every text normalized. */
export interface CustomOrderRequest {
  /** A design slug in valid form; the caller must still check it is published. */
  designSlug: string | null;
  occasionId: string | null;
  decoration: DecorationType | null;
  mini: boolean;
  description: string;
  flavour: string;
  writing: string;
  /** Requested date, YYYY-MM-DD, or null. */
  date: string | null;
  name: string;
  notes: string;
}

/** What the form shows again after a failed attempt: the cleaned values, as strings. */
export type CustomOrderValues = Record<CustomOrderField | 'mini', string>;

export type CustomOrderParseResult =
  | { ok: true; request: CustomOrderRequest; values: CustomOrderValues }
  | {
      ok: false;
      errors: Partial<Record<CustomOrderField, CustomOrderErrorCode>>;
      values: CustomOrderValues;
      designSlug: string | null;
    };

// C0 and C1 control characters, except tab and line feed (handled separately).
// Matching control characters is the point here, so the lint rule against them is off.
// eslint-disable-next-line no-control-regex
const CONTROL = new RegExp('[\\u0000-\\u0008\\u000B-\\u001F\\u007F-\\u009F]', 'g');
// Bidirectional overrides, embeddings, isolates and marks: they can make a message read
// differently from what was typed, and are never needed in an order.
const BIDI = new RegExp('[\\u061C\\u200E\\u200F\\u202A-\\u202E\\u2066-\\u2069]', 'g');
// Invisible characters that carry nothing in an order: soft hyphen, Mongolian vowel
// separator, zero-width space, word joiner and invisible operators, byte-order mark. Text
// made only of them must count as empty. Zero-width (non-)joiners (U+200C, U+200D) stay:
// emoji sequences and some scripts need them.
const INVISIBLE = new RegExp('[\\u00AD\\u180E\\u200B\\u2060-\\u2064\\uFEFF]', 'g');
// A UTF-16 half without its partner cannot be encoded in a link; it becomes U+FFFD.
const LONE_SURROGATE = new RegExp(
  '[\\uD800-\\uDBFF](?![\\uDC00-\\uDFFF])|(?<![\\uD800-\\uDBFF])[\\uDC00-\\uDFFF]',
  'g',
);

const LINE_BREAKS = new RegExp('\\r\\n?|[\\u2028\\u2029]', 'g');
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

const length = (text: string) => [...text].length;

/**
 * Steps shared by both normalizers: well-formed UTF-16, NFC, one kind of line break,
 * tabs as spaces, and no control, direction or invisible characters.
 */
function clean(text: string, lineBreak: string): string {
  return text
    .replace(LONE_SURROGATE, '\uFFFD')
    .normalize('NFC')
    .replace(LINE_BREAKS, lineBreak)
    .replace(/\t/g, ' ')
    .replace(CONTROL, '')
    .replace(BIDI, '')
    .replace(INVISIBLE, '');
}

/** One line of text: cleaned, single spaces, trimmed. */
export function normalizeLine(value: unknown): string {
  if (typeof value !== 'string') return '';
  return clean(value, ' ').replace(/\s+/g, ' ').trim();
}

/** Several lines of text: each line like normalizeLine, at most one empty line in a row. */
export function normalizeText(value: unknown): string {
  if (typeof value !== 'string') return '';
  return clean(value, '\n')
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** A design reference from a URL or form: a single slug-shaped string, or null. */
export function parseDesignReference(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const slug = value.trim();
  return slug.length > 0 && slug.length <= 100 && SLUG.test(slug) ? slug : null;
}

/** A real calendar date in YYYY-MM-DD form, as days since 1970-01-01, or null. */
function dayNumber(date: string): number | null {
  const match = DATE.exec(date);
  if (!match) return null;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const time = Date.UTC(year, month - 1, day);
  const back = new Date(time);
  if (
    back.getUTCFullYear() !== year ||
    back.getUTCMonth() !== month - 1 ||
    back.getUTCDate() !== day
  ) {
    return null;
  }
  return time / 86_400_000;
}

/** The first date that respects the notice: today plus whole days of lead time. */
export function earliestOrderDate(today: string, leadHours: number): string {
  const start = dayNumber(today);
  if (start === null) throw new Error(`Invalid "today" date "${today}", expected YYYY-MM-DD.`);
  const first = start + Math.ceil(leadHours / 24);
  return new Date(first * 86_400_000).toISOString().slice(0, 10);
}

/** The last date that may be requested. */
export function latestOrderDate(today: string): string {
  const start = dayNumber(today);
  if (start === null) throw new Error(`Invalid "today" date "${today}", expected YYYY-MM-DD.`);
  return new Date((start + MAX_DAYS_AHEAD) * 86_400_000).toISOString().slice(0, 10);
}

const optionalChoice = <T extends string>(values: readonly T[]) =>
  z.union([z.literal(''), z.enum(values as [T, ...T[]])]);

interface ParseOptions {
  /** Today in the shop's time zone, YYYY-MM-DD. */
  today: string;
  /** Notice the shop needs (StoreSettings.defaultLeadHours). */
  leadHours: number;
  /** Occasions that exist (Occasion.id). */
  occasionIds: readonly string[];
}

/**
 * Cleans and checks a submitted inquiry. Every value is normalized first, so limits and
 * rules apply to what would actually be sent. The only required field is a description,
 * and only when no design is referenced: an inquiry must say what is wanted.
 */
export function parseCustomOrder(
  input: Readonly<Record<string, unknown>>,
  { today, leadHours, occasionIds }: ParseOptions,
): CustomOrderParseResult {
  const values: CustomOrderValues = {
    occasion: normalizeLine(input.occasion),
    decoration: normalizeLine(input.decoration),
    mini: input.mini === 'on' || input.mini === true ? 'on' : '',
    description: normalizeText(input.description),
    flavour: normalizeLine(input.flavour),
    writing: normalizeLine(input.writing),
    date: normalizeLine(input.date),
    name: normalizeLine(input.name),
    notes: normalizeText(input.notes),
  };
  const designSlug = parseDesignReference(input.design);
  const errors: Partial<Record<CustomOrderField, CustomOrderErrorCode>> = {};

  if (!optionalChoice(occasionIds).safeParse(values.occasion).success) errors.occasion = 'invalid';
  if (!optionalChoice(decorationTypeSchema.options).safeParse(values.decoration).success) {
    errors.decoration = 'invalid';
  }

  for (const field of ['name', 'description', 'flavour', 'writing', 'notes'] as const) {
    if (length(values[field]) > CUSTOM_ORDER_LIMITS[field]) errors[field] = 'tooLong';
  }
  if (!errors.description && values.description === '' && designSlug === null) {
    errors.description = 'required';
  }

  if (values.date !== '') {
    const day = dayNumber(values.date);
    if (day === null) errors.date = 'invalid';
    else if (values.date < earliestOrderDate(today, leadHours)) errors.date = 'tooSoon';
    else if (values.date > latestOrderDate(today)) errors.date = 'tooFar';
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors, values, designSlug };

  return {
    ok: true,
    values,
    request: {
      designSlug,
      occasionId: values.occasion || null,
      decoration: (values.decoration || null) as DecorationType | null,
      mini: values.mini === 'on',
      description: values.description,
      flavour: values.flavour,
      writing: values.writing,
      date: values.date || null,
      name: values.name,
      notes: values.notes,
    },
  };
}
