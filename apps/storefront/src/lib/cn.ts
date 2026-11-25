import { clsx } from 'clsx';
import type { ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

// Teach tailwind-merge the custom type scale, so `text-display-l` and `text-ink`
// are treated as a size and a colour rather than two conflicting colours.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [
        { text: ['display-xl', 'display-l', 'display-m', 'display-s', 'lede', 'small'] },
      ],
    },
  },
});

/** Combine class names; later Tailwind classes override earlier conflicting ones. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
