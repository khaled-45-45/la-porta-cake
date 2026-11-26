import { useTranslations } from 'next-intl';

import type { CustomOrderFormProps } from '@/components/custom-order';
import { ChosenDesign, CustomOrderForm } from '@/components/custom-order';
import { Breadcrumbs } from '@/components/shared';
import { Container } from '@/components/ui';
import { useSiteLocale } from '@/i18n/use-site-locale';
import type { CustomOrderPageData } from '@/lib/custom-order';
import { DECORATION_TYPES } from '@/lib/filters';
import { routes } from '@/lib/routes';

interface CustomOrderViewProps {
  data: CustomOrderPageData;
  /** The custom-order server action, bound to the page's language. */
  action: CustomOrderFormProps['action'];
  limits: CustomOrderFormProps['limits'];
}

/**
 * The custom-order page (prototype Custom): what happens (a WhatsApp message the
 * customer sends; no payment, no confirmed order on the site), the chosen design if the
 * customer came from the gallery, and the inquiry form.
 *
 * The design is drawn on the server (ChosenDesign) and handed to the form as an element;
 * the form receives only its slug, the starting choices and plain option lists, never the
 * design record, and hides the design if the server reports it is no longer published.
 */
export function CustomOrderView({ data, action, limits }: CustomOrderViewProps) {
  const t = useTranslations('CustomOrder');
  const gallery = useTranslations('Gallery');
  const nav = useTranslations('Nav');
  const locale = useSiteLocale();
  const { design, occasions, settings, earliestDate, latestDate } = data;

  const form = (
    <CustomOrderForm
      action={action}
      designSlug={design?.slug ?? null}
      defaults={{
        decoration: design?.decoration ?? '',
        mini: design?.isMini ? 'on' : '',
        // Preselect the occasion only when the design suits exactly one.
        occasion: design?.occasionIds.length === 1 ? (design.occasionIds[0] ?? '') : '',
      }}
      occasions={occasions.map((o) => ({ id: o.id, name: o.name[locale] }))}
      decorations={DECORATION_TYPES.map((value) => ({
        value,
        label: gallery(`decoration.${value}`),
      }))}
      limits={limits}
      earliestDate={earliestDate}
      latestDate={latestDate}
      leadDays={Math.max(1, Math.ceil(settings.defaultLeadHours / 24))}
      chosenDesign={design ? <ChosenDesign design={design} /> : undefined}
    />
  );

  return (
    <main id="main" className="flex-1">
      <Container className="pb-24">
        <Breadcrumbs
          items={[{ label: nav('home'), href: routes.home }, { label: nav('customOrder') }]}
        />
        <header className="flex max-w-[760px] flex-col gap-4 pt-6 pb-10">
          <h1 className="m-0 text-display-xl">{t('title')}</h1>
          <p className="m-0 max-w-[34em] text-lede text-muted">{t('lede')}</p>
          <p className="m-0 text-small font-medium">{t('paymentNote')}</p>
        </header>

        {design ? form : <div className="max-w-[720px]">{form}</div>}
      </Container>
    </main>
  );
}
