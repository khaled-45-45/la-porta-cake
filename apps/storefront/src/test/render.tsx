import { render } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import type { ReactElement } from 'react';

import type { Locale } from '@la-porta/domain/locale';
import { directionFor } from '@la-porta/domain/locale';

import ar from '../../messages/ar.json';
import en from '../../messages/en.json';

const messages = { ar, en };

/** Renders UI the way a page would: with the locale's messages and text direction. */
export function renderWithLocale(ui: ReactElement, locale: Locale = 'ar') {
  return render(
    <NextIntlClientProvider locale={locale} messages={messages[locale]} timeZone="Asia/Amman">
      <div dir={directionFor(locale)} lang={locale}>
        {ui}
      </div>
    </NextIntlClientProvider>,
  );
}

/** Tailwind classes tied to left or right, which would break the other text direction. */
export const PHYSICAL_DIRECTION_CLASS =
  /(^|\s|:)-?(ml|mr|pl|pr|left|right|text-left|text-right|rounded-l|rounded-r|rounded-tl|rounded-tr|rounded-bl|rounded-br|border-l|border-r|float-left|float-right)(-|\s|$)/;

/** All class names used anywhere in a rendered container. */
export function allClassNames(container: HTMLElement): string[] {
  return [container, ...container.querySelectorAll('*')]
    .map((el) => el.getAttribute('class') ?? '')
    .filter(Boolean);
}
