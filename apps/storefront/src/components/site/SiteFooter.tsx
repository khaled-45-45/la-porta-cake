import { useLocale, useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

import type { Category, OpeningHours, StoreSettings } from '@la-porta/domain';
import type { Locale } from '@la-porta/domain/locale';
import { DEFAULT_LOCALE, isLocale } from '@la-porta/domain/locale';

import { buttonClassName, Container } from '@/components/ui';
import { Link } from '@/i18n/navigation';
import { formatTimeOfDay } from '@/lib/format';
import { routes } from '@/lib/routes';

interface SiteFooterProps {
  /** Verified store details (Phase 2 content); nothing here is typed in by hand. */
  settings: StoreSettings;
  /** Shop categories, linked under "Pages". */
  categories: readonly Category[];
}

const DAY_KEYS = { daily: 'daily', 'sat-thu': 'satThu', fri: 'fri' } as const;

function FooterColumn({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h2 className="m-0 mb-3.5 font-display text-lg text-paper">{title}</h2>
      <ul className="m-0 flex list-none flex-col gap-2 p-0 text-[0.9375rem] text-on-ink-muted">
        {children}
      </ul>
    </div>
  );
}

const linkClass = 'no-underline transition-colors hover:text-rose-soft';

/**
 * The site footer (prototype Footer): brand, visit details, contact links and page links.
 * Every contact detail comes from the store settings; Messenger appears only once its
 * link is known.
 */
export function SiteFooter({ settings, categories }: SiteFooterProps) {
  const t = useTranslations('Footer');
  const nav = useTranslations('Nav');
  const current = useLocale();
  const locale: Locale = isLocale(current) ? current : DEFAULT_LOCALE;

  const hours = (h: OpeningHours) =>
    t('hours', {
      days: t(`days.${DAY_KEYS[h.days]}`),
      opens: formatTimeOfDay(h.opens, locale),
      closes: formatTimeOfDay(h.closes, locale),
    });

  return (
    <footer className="bg-ink text-on-ink focus-ring-on-dark">
      <Container>
        <div className="grid grid-cols-1 gap-8 pt-14 pb-8 sm:grid-cols-2 sm:gap-12 sm:pt-18 sm:pb-12 nav:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="flex flex-col gap-3.5">
            <p lang="en" className="m-0 font-latin text-[2.125rem] text-paper">
              La Porta
            </p>
            <p className="m-0 text-[0.9375rem] text-on-ink-muted">{t('tagline')}</p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <a
                href={settings.whatsapp.url}
                className={buttonClassName({ variant: 'rose', size: 'sm' })}
              >
                {nav('orderWhatsApp')}
              </a>
              <a
                href={settings.instagram.url}
                className={buttonClassName({
                  size: 'sm',
                  className: 'border-muted bg-transparent text-paper hover:bg-ink-hover',
                })}
              >
                {t('instagram')}
              </a>
            </div>
          </div>

          <FooterColumn title={t('visit')}>
            <li>{settings.address[locale]}</li>
            {settings.hours.map((h) => (
              <li key={h.days}>{hours(h)}</li>
            ))}
            <li>
              <a
                href={settings.mapsUrl}
                className="underline underline-offset-[5px] transition-colors hover:text-rose-soft"
              >
                {t('map')}
              </a>
            </li>
          </FooterColumn>

          <FooterColumn title={t('contact')}>
            <li>
              <a href={settings.whatsapp.url} className={linkClass}>
                {t('whatsapp')}: <bdi dir="ltr">{settings.phone.display}</bdi>
              </a>
            </li>
            <li>
              <a href={settings.instagram.url} className={linkClass}>
                {t('instagram')}: <bdi dir="ltr">@{settings.instagram.handle}</bdi>
              </a>
            </li>
            <li>
              <a href={settings.facebook.url} className={linkClass}>
                {t('facebook')}: {settings.name[locale]}
              </a>
            </li>
            {settings.messenger.url ? (
              <li>
                <a href={settings.messenger.url} className={linkClass}>
                  {t('messenger')}
                </a>
              </li>
            ) : null}
            {settings.delivery.available ? <li>{t('delivery')}</li> : null}
          </FooterColumn>

          <FooterColumn title={t('pages')}>
            <li>
              <Link href={routes.shop} className={linkClass}>
                {nav('shop')}
              </Link>
            </li>
            {categories.map((category) => (
              <li key={category.id}>
                <Link href={routes.category(category.slug)} className={linkClass}>
                  {category.name[locale]}
                </Link>
              </li>
            ))}
            <li>
              <Link href={routes.customOrder} className={linkClass}>
                {nav('customOrder')}
              </Link>
            </li>
            <li>
              <Link href={routes.ourWork} className={linkClass}>
                {nav('ourWork')}
              </Link>
            </li>
            <li>
              <Link href={routes.faq} className={linkClass}>
                {nav('faq')}
              </Link>
            </li>
            <li>
              <Link href={routes.about} className={linkClass}>
                {nav('about')}
              </Link>
            </li>
          </FooterColumn>
        </div>

        <div className="flex flex-wrap justify-between gap-x-8 gap-y-3 border-t border-ink-line py-5.5 text-[0.8125rem] text-on-ink-faint">
          <span>{t('copyright', { name: settings.name[locale] })}</span>
          <span>{t('paymentNote')}</span>
        </div>
      </Container>
    </footer>
  );
}
