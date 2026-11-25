/**
 * Design tokens of La Porta Cake, taken unchanged from the approved prototype (lp.css).
 * globals.css defines the same values for Tailwind; a test keeps the two in sync.
 */
export const colors = {
  cream: '#f7efe8',
  paper: '#fffbf7',
  sand: '#ede0d5',
  blush: '#efd9d6',
  ink: '#0a0a0a',
  'ink-hover': '#2a2422',
  muted: '#5a504d',
  line: '#dfcfc3',
  rose: '#c98790',
  'rose-dark': '#b56e78',
  'rose-ink': '#8a4550',
  'rose-soft': '#e7b9bf',
  ok: '#2e6a3e',
  pre: '#8a570c',
  off: '#6b6360',
  white: '#ffffff',
} as const;

export type ColorToken = keyof typeof colors;

/**
 * Text and background pairs the design uses for text. Each must reach WCAG AA (4.5:1).
 * [text colour, background colour, where it is used]
 */
export const textColorPairs: readonly [ColorToken, ColorToken, string][] = [
  ['ink', 'cream', 'body text on the page background'],
  ['ink', 'paper', 'text on cards and inputs'],
  ['ink', 'sand', 'text on sand sections'],
  ['ink', 'blush', 'text in notes'],
  ['muted', 'cream', 'secondary text on the page background'],
  ['muted', 'paper', 'secondary text on cards'],
  ['muted', 'sand', 'secondary text on sand sections'],
  ['rose-ink', 'cream', 'eyebrow and meta text'],
  ['rose-ink', 'paper', 'meta text on cards'],
  ['paper', 'ink', 'dark buttons and footer text'],
  ['ink', 'rose', 'text on rose buttons'],
  ['ok', 'paper', '"Ready" badge'],
  ['pre', 'paper', '"Preorder" badge'],
  ['off', 'paper', '"Unavailable" and "Seasonal" badges'],
];
