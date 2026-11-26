import { useTranslations } from 'next-intl';

import type { Availability, Product } from '@la-porta/domain';

import { CardGrid } from '@/components/shared';
import { AvailabilityBadge } from '@/components/ui';

import { ProductCard } from './ProductCard';

/** Group order on the page: what is in the shop first, then made to order, then the rest. */
const GROUP_ORDER: readonly Availability[] = ['ready', 'preorder', 'seasonal', 'unavailable'];

interface ProductMenuProps {
  products: readonly Product[];
  className?: string;
}

/**
 * A category shown as a menu grouped by availability (prototype Cat-Treats, category
 * layout "menu-list"): "In the shop", "Made to order", "Seasonal". Each group has its own
 * heading and badge; empty groups are left out. The cards are the shared ProductCard,
 * without the category label, since the whole page is one category.
 */
export function ProductMenu({ products, className }: ProductMenuProps) {
  const t = useTranslations('CategoryPage');
  const groups = GROUP_ORDER.map((availability) => ({
    availability,
    items: products.filter((p) => p.availability === availability),
  })).filter((group) => group.items.length > 0);

  return (
    <div className={className}>
      {groups.map(({ availability, items }, index) => (
        <section
          key={availability}
          aria-labelledby={`menu-${availability}`}
          className="flex flex-col gap-6 border-t-[1.5px] border-ink pt-5 pb-14"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id={`menu-${availability}`} className="m-0 text-display-s">
              {t(`group.${availability}`)}
            </h2>
            <AvailabilityBadge availability={availability} />
          </div>
          <CardGrid variant="products">
            {items.map((product, i) => (
              <li key={product.id}>
                <ProductCard product={product} headingLevel={3} eager={index === 0 && i < 4} />
              </li>
            ))}
          </CardGrid>
        </section>
      ))}
    </div>
  );
}
