import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { ReactNode } from 'react';

import type { Availability } from '@la-porta/domain';

import {
  ArchFrame,
  AvailabilityBadge,
  Button,
  Chip,
  Container,
  Field,
  ImagePlaceholder,
  Input,
  LanguageSwitcher,
  PriceTag,
  Section,
  SectionHeading,
  Textarea,
} from '@/components/ui';
import { colors } from '@/design/tokens';

export const metadata: Metadata = { robots: { index: false, follow: false } };

interface PageProps {
  params: Promise<{ locale: string }>;
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-5 border-t border-line pt-8">
      <h2 className="m-0 text-display-s">{title}</h2>
      {children}
    </section>
  );
}

const AVAILABILITY: Availability[] = ['ready', 'preorder', 'unavailable', 'seasonal'];

/**
 * Internal preview of the design tokens and UI primitives, in the page's language.
 * Development only: a production build answers "page not found" (Phase 3 scope).
 */
export default async function DesignSystemPage({ params }: PageProps) {
  if (process.env.NODE_ENV === 'production') notFound();

  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('DesignSystem');

  return (
    <main id="main" className="flex-1">
      <Container className="flex flex-col gap-12 py-16">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <SectionHeading level={1} title={t('title')} lede={t('note')} />
          <LanguageSwitcher />
        </header>

        <Group title={t('colors')}>
          <ul className="m-0 grid list-none grid-cols-2 gap-4 p-0 sm:grid-cols-4">
            {Object.entries(colors).map(([name, value]) => (
              <li key={name} className="flex flex-col gap-2">
                <span
                  className="h-16 rounded-card border border-line"
                  style={{ backgroundColor: value }}
                />
                <span className="text-small">
                  <bdi>{name}</bdi> · <bdi>{value}</bdi>
                </span>
              </li>
            ))}
          </ul>
        </Group>

        <Group title={t('typography')}>
          <p className="m-0 text-display-xl">{t('sampleDisplay')}</p>
          <p className="m-0 text-display-l">{t('sampleDisplay')}</p>
          <p className="m-0 text-display-m">{t('sampleDisplay')}</p>
          <p className="m-0 text-display-s">{t('sampleDisplay')}</p>
          <p className="m-0 max-w-[34em] text-lede text-muted">{t('sampleLede')}</p>
          <p className="m-0 max-w-[36em] text-muted">{t('sampleBody')}</p>
          <p className="m-0 text-small text-muted">{t('sampleBody')}</p>
        </Group>

        <Group title={t('buttons')}>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="dark">{t('browseCakes')}</Button>
            <Button variant="line">{t('orderWhatsApp')}</Button>
            <Button variant="rose">{t('orderWhatsApp')}</Button>
            <Button variant="dark" size="sm">
              {t('browseCakes')}
            </Button>
            <Button variant="line" disabled>
              {t('browseCakes')}
            </Button>
          </div>
          <div className="rounded-panel bg-ink p-6">
            <Button variant="light">{t('browseCakes')}</Button>
          </div>
        </Group>

        <Group title={t('chips')}>
          <div className="flex flex-wrap gap-2.5">
            <Chip selected>{t('birthday')}</Chip>
            <Chip>{t('graduation')}</Chip>
          </div>
        </Group>

        <Group title={t('availability')}>
          <div className="flex flex-wrap gap-3">
            {AVAILABILITY.map((a) => (
              <AvailabilityBadge key={a} availability={a} />
            ))}
          </div>
        </Group>

        <Group title={t('prices')}>
          <div className="flex flex-wrap gap-6">
            <PriceTag priceJod={null} />
            <PriceTag priceJod={12.5} />
          </div>
        </Group>

        <Group title={t('arch')}>
          <div className="grid max-w-xl grid-cols-2 gap-10 pt-6">
            <ArchFrame>
              <ImagePlaceholder name={t('sampleProduct')} className="aspect-[4/5]" />
            </ArchFrame>
            <ArchFrame outlined>
              <ImagePlaceholder name={t('sampleProduct')} className="aspect-[4/5]" />
            </ArchFrame>
          </div>
        </Group>

        <Group title={t('placeholder')}>
          <ImagePlaceholder
            name={t('sampleProduct')}
            className="aspect-[4/5] max-w-xs rounded-card"
          />
        </Group>

        <Group title={t('forms')}>
          <div className="grid max-w-xl gap-5">
            <Field id="ds-name" label={t('nameLabel')} hint={t('nameHint')}>
              {(control) => <Input {...control} />}
            </Field>
            <Field id="ds-name-error" label={t('nameLabel')} error={t('nameError')}>
              {(control) => <Input {...control} />}
            </Field>
            <Field id="ds-notes" label={t('notesLabel')}>
              {(control) => <Textarea {...control} />}
            </Field>
          </div>
        </Group>
      </Container>

      <Section tone="sand" spacing="tight">
        <Container>
          <SectionHeading title={t('sampleDisplay')} lede={t('sampleLede')} />
        </Container>
      </Section>
    </main>
  );
}
