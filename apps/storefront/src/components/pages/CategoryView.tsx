import { useTranslations } from 'next-intl';

import { CategoryNav, ProductCatalog, ProductMenu } from '@/components/catalog';
import { WhatsAppIcon } from '@/components/icons';
import { Breadcrumbs, EmptyState } from '@/components/shared';
import { Button, Container } from '@/components/ui';
import { useSiteLocale } from '@/i18n/use-site-locale';
import { routes } from '@/lib/routes';
import type { CategoryPageData } from '@/lib/storefront';
import { whatsappOrderUrl } from '@/lib/whatsapp';

/**
 * A shop category (prototype Cat-Celebration, Cat-Treats). Its layout comes from the
 * category's own data: "flavour-wall" shows the searchable grid (ProductCatalog),
 * "menu-list" groups the items by availability (ProductMenu). Only this category's
 * public products are passed in.
 */
export function CategoryView({ data }: { data: CategoryPageData }) {
  const t = useTranslations('CategoryPage');
  const nav = useTranslations('Nav');
  const locale = useSiteLocale();
  const { category, categories, products, settings } = data;
  const phone = settings.phone.display;
  const name = category.name[locale];

  return (
    <main id="main" className="flex-1">
      <Container className="pb-24">
        <Breadcrumbs
          items={[
            { label: nav('home'), href: routes.home },
            { label: nav('shop'), href: routes.shop },
            { label: name },
          ]}
        />
        <header className="flex max-w-[760px] flex-col gap-4 pt-6 pb-8">
          <h1 className="m-0 text-display-xl">{name}</h1>
          {category.description ? (
            <p className="m-0 max-w-[34em] text-lede text-muted">{category.description[locale]}</p>
          ) : null}
          <p className="m-0 text-small text-muted">
            {t.rich('statusNote', {
              number: phone,
              phone: () => <bdi dir="ltr">{phone}</bdi>,
            })}
          </p>
          <div>
            <Button
              href={whatsappOrderUrl(settings.whatsapp.number, t('askMessage', { category: name }))}
              size="sm"
            >
              <WhatsAppIcon />
              {t('askWhatsApp')}
            </Button>
          </div>
        </header>

        <CategoryNav categories={categories} current={category.slug} className="pb-8" />

        {products.length === 0 ? (
          <EmptyState title={t('empty')} />
        ) : category.layout === 'menu-list' ? (
          <ProductMenu products={products} />
        ) : (
          <ProductCatalog products={products} categories={[category]} />
        )}
      </Container>
    </main>
  );
}
