import { useId } from 'react';

import type { Category, Product } from '@la-porta/domain';

import { AvailabilityBadge } from '@/components/ui';
import { Link } from '@/i18n/navigation';
import { useSiteLocale } from '@/i18n/use-site-locale';
import { isPublicProduct, primaryPublicImage } from '@/lib/catalog';
import { cn } from '@/lib/cn';
import { routes } from '@/lib/routes';

import { ProductImage } from './ProductImage';
import { ProductPrice } from './ProductPrice';

interface ProductCardProps {
  product: Product;
  /** The product's category; its name is shown above the product name. */
  category?: Category;
  headingLevel?: 2 | 3;
  /** Load the photo straight away, for cards in the first row (no preload). */
  eager?: boolean;
  className?: string;
}

/**
 * A product in a grid (prototype .card-link.pcard): photo or placeholder with the
 * availability badge, category, name and price. The whole card links to the product page.
 *
 * Screen readers hear the product name as the link's name, then the category,
 * availability and price as its description.
 *
 * Server component: it reads the visibility rules, which never reach the browser, and
 * draws nothing for an inactive product even if a data source passes one by mistake.
 */
export function ProductCard({
  product,
  category,
  headingLevel = 2,
  eager = false,
  className,
}: ProductCardProps) {
  const locale = useSiteLocale();
  const ids = { name: useId(), category: useId(), availability: useId(), price: useId() };
  if (!isPublicProduct(product)) return null;

  const name = product.name[locale];
  const Heading = `h${headingLevel}` as const;
  const describedBy = [category ? ids.category : null, ids.availability, ids.price]
    .filter(Boolean)
    .join(' ');

  return (
    <Link
      href={routes.product(product.slug)}
      data-product={product.slug}
      aria-labelledby={ids.name}
      aria-describedby={describedBy}
      className={cn('group flex flex-col gap-3.5 no-underline', className)}
    >
      <div className="relative">
        <ProductImage
          image={primaryPublicImage(product)}
          name={name}
          decorative
          eager={eager}
          className="aspect-[4/5] rounded-card"
        />
        <span id={ids.availability} className="absolute start-3 top-3">
          <AvailabilityBadge availability={product.availability} />
        </span>
      </div>
      <div className="flex flex-col gap-0.5">
        {category ? (
          <p id={ids.category} className="m-0 text-small text-muted">
            {category.name[locale]}
          </p>
        ) : null}
        <Heading
          id={ids.name}
          className="m-0 font-display text-[1.0625rem] leading-[1.4] decoration-rose underline-offset-[5px] group-hover:underline sm:text-xl"
        >
          {name}
        </Heading>
        <span id={ids.price}>
          <ProductPrice product={product} />
        </span>
      </div>
    </Link>
  );
}
