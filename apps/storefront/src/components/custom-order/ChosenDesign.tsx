import Image from 'next/image';
import { useTranslations } from 'next-intl';

import type { Design } from '@la-porta/domain';

import { TextLink } from '@/components/ui';
import { useSiteLocale } from '@/i18n/use-site-locale';
import { routes } from '@/lib/routes';

/**
 * The gallery design the customer chose, beside the custom-order form: photo, title
 * (linking to its page), decoration type, and links to choose another or none.
 *
 * A server component: CustomOrderView renders it and hands the result to the form, which
 * only decides whether to show it. The design record itself never reaches the browser.
 */
export function ChosenDesign({ design }: { design: Design }) {
  const t = useTranslations('CustomOrder');
  const gallery = useTranslations('Gallery');
  const locale = useSiteLocale();

  return (
    <aside
      aria-labelledby="chosen-design-title"
      className="flex flex-row items-start gap-4 rounded-panel border border-line bg-paper p-4 lg:sticky lg:top-6 lg:order-last lg:flex-col"
    >
      <div className="relative aspect-[4/5] w-24 shrink-0 overflow-hidden rounded-card bg-sand sm:w-40 lg:w-full">
        <Image
          src={design.image.src}
          alt={design.image.alt[locale]}
          fill
          sizes="(min-width: 1024px) 330px, (min-width: 640px) 160px, 96px"
          loading="eager"
          className="object-cover"
        />
      </div>
      <div className="flex min-w-0 flex-col gap-2">
        <h2 id="chosen-design-title" className="m-0 text-small font-semibold text-muted">
          {t('designTitle')}
        </h2>
        <p className="m-0 font-display text-lg leading-[1.4]">
          <TextLink href={routes.design(design.slug)}>{design.title[locale]}</TextLink>
        </p>
        <p className="m-0 text-small font-semibold text-rose-ink">
          {gallery(`decoration.${design.decoration}`)}
        </p>
        <ul className="m-0 mt-1 flex list-none flex-wrap gap-x-5 gap-y-2 p-0 text-small">
          <li>
            <TextLink href={routes.ourWork}>{t('designChange')}</TextLink>
          </li>
          <li>
            <TextLink href={routes.customOrder}>{t('designRemove')}</TextLink>
          </li>
        </ul>
      </div>
    </aside>
  );
}
