import type { Product } from '@la-porta/domain';

import { PriceTag } from '@/components/ui';
import { displayPriceJod } from '@/lib/catalog';

interface ProductPriceProps {
  product: Product;
  className?: string;
}

/**
 * A product's price as confirmed by the shop, or "Price on request" (decision 0005).
 * Which size's price to show is decided by displayPriceJod(); nothing is estimated.
 */
export function ProductPrice({ product, className }: ProductPriceProps) {
  return <PriceTag priceJod={displayPriceJod(product)} className={className} />;
}
