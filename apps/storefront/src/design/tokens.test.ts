// @vitest-environment node
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { colors, textColorPairs } from './tokens';

const css = readFileSync(fileURLToPath(new URL('../app/globals.css', import.meta.url)), 'utf8');

/** WCAG 2 relative luminance and contrast ratio. */
function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

describe('design tokens', () => {
  it('keep the prototype colours (lp.css)', () => {
    expect(colors).toMatchObject({
      cream: '#f7efe8',
      paper: '#fffbf7',
      sand: '#ede0d5',
      blush: '#efd9d6',
      ink: '#0a0a0a',
      muted: '#5a504d',
      line: '#dfcfc3',
      rose: '#c98790',
      'rose-dark': '#b56e78',
      'rose-ink': '#8a4550',
      'rose-soft': '#e7b9bf',
      ok: '#2e6a3e',
      pre: '#8a570c',
      off: '#6b6360',
    });
  });

  it('define the same colours in globals.css and tokens.ts', () => {
    for (const [name, value] of Object.entries(colors)) {
      expect(css).toContain(`--color-${name}: ${value};`);
    }
    const cssColors = [...css.matchAll(/--color-([a-z-]+): #/g)].map((m) => m[1]);
    expect(cssColors.sort()).toEqual(Object.keys(colors).sort());
  });

  it.each(textColorPairs)('%s on %s meets WCAG AA contrast (%s)', (text, background) => {
    expect(contrast(colors[text], colors[background])).toBeGreaterThanOrEqual(4.5);
  });
});
