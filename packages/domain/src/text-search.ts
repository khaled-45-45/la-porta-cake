// Text search shared by the repositories (server) and the shop filters (browser).
// No imports, so browser code can use it through "@la-porta/domain/search" without
// pulling zod and the content schemas into the bundle.

/** Arabic harakat, Quranic marks and tatweel: they never change which word is meant. */
const ARABIC_MARKS = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g;
const LATIN_MARKS = /[\u0300-\u036f]/g;
/**
 * Invisible format characters that copied text often carries: zero-width space and
 * (non-)joiners, LRM/RLM, bidi embeddings and isolates, word joiner, BOM. Removed (not
 * turned into spaces), so "لو<ZWNJ>تس" still reads "لوتس".
 */
const FORMAT_CHARS = /[\u200B-\u200F\u202A-\u202E\u2060-\u2064\u2066-\u2069\uFEFF]/g;

/**
 * Lower-case text without accents, Arabic diacritics or invisible format characters, with
 * letter variants folded together: "كيكه" finds "كيكة", "اوريو" finds "أوريو", "creme"
 * finds "crème", and Persian ک/ی (from a Persian keyboard) find ك/ي. Letters that change
 * the word (ح/خ, ت/ث, …) are never folded.
 */
export function normalizeSearchText(text: string): string {
  return text
    .normalize('NFKD')
    .replace(LATIN_MARKS, '')
    .normalize('NFC')
    .replace(FORMAT_CHARS, '')
    .replace(ARABIC_MARKS, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/[ىئی]/g, 'ي')
    .replace(/ک/g, 'ك')
    .replace(/ة/g, 'ه')
    .replace(/ؤ/g, 'و')
    .toLocaleLowerCase('en')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Whether every word of the query appears in any of the texts. An empty query matches.
 * Texts may be given already normalized; normalizing twice changes nothing.
 */
export function matchesSearch(texts: readonly string[], query: string | undefined): boolean {
  const words = normalizeSearchText(query ?? '')
    .split(' ')
    .filter(Boolean);
  if (words.length === 0) return true;
  const haystack = texts.map(normalizeSearchText).join(' ');
  return words.every((word) => haystack.includes(word));
}
