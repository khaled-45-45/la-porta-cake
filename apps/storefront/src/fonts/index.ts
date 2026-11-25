import localFont from 'next/font/local';

// Self-hosted fonts (decision 0011). Each folder holds the font's SIL Open Font License.
// Preloading is off for now: fonts load when text uses them. Revisited in Phase 7 (performance).

/** Arabic headings. Variable font, weights 400–700. */
export const reemKufi = localFont({
  src: './reem-kufi/ReemKufi-Variable.ttf',
  variable: '--font-reem-kufi',
  weight: '400 700',
  display: 'swap',
  preload: false,
});

/** Body text in both languages. */
export const plexSansArabic = localFont({
  src: [
    {
      path: './ibm-plex-sans-arabic/IBMPlexSansArabic-Regular.ttf',
      weight: '400',
      style: 'normal',
    },
    { path: './ibm-plex-sans-arabic/IBMPlexSansArabic-Medium.ttf', weight: '500', style: 'normal' },
    {
      path: './ibm-plex-sans-arabic/IBMPlexSansArabic-SemiBold.ttf',
      weight: '600',
      style: 'normal',
    },
  ],
  variable: '--font-plex-sans-arabic',
  display: 'swap',
  preload: false,
});

/** English headings and the "La Porta" wordmark. */
export const marcellus = localFont({
  src: './marcellus/Marcellus-Regular.ttf',
  variable: '--font-marcellus',
  weight: '400',
  display: 'swap',
  preload: false,
});

/** Class names that define the three font CSS variables on <html>. */
export const fontVariables = [reemKufi.variable, plexSansArabic.variable, marcellus.variable].join(
  ' ',
);
