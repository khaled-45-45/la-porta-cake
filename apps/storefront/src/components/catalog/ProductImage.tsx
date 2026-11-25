import Image from 'next/image';

import type { ImageRef } from '@la-porta/domain';

import { ImagePlaceholder } from '@/components/ui';
import { useSiteLocale } from '@/i18n/use-site-locale';
import { cn } from '@/lib/cn';

/** Card widths: four columns on wide screens, two below 1100px (prototype .g4). */
export const PRODUCT_CARD_SIZES = '(min-width: 1100px) 290px, 50vw';

interface ProductImageProps {
  /** A public, approved photo, or undefined for the "no photo yet" placeholder. */
  image: ImageRef | undefined;
  /** Product name, used by the placeholder's label. */
  name: string;
  /**
   * Leave the photo out of the accessibility tree when the name is already next to it,
   * as on a card. The placeholder always keeps its label ("name: no photo yet").
   */
  decorative?: boolean;
  sizes?: string;
  /**
   * Load straight away instead of lazily, for photos in the first screen (Next.js 16:
   * loading="eager" replaces the deprecated priority prop). Grids have several possible
   * largest images, so the docs advise against preload here.
   */
  eager?: boolean;
  /** Shape of the frame, e.g. "aspect-[4/5] rounded-card". */
  className?: string;
}

/**
 * A product photo in a fixed-ratio frame (prototype .ph with .pimg), or the placeholder.
 * Callers choose the photo with primaryPublicImage(), so only approved public images
 * reach this component.
 */
export function ProductImage({
  image,
  name,
  decorative = false,
  sizes = PRODUCT_CARD_SIZES,
  eager = false,
  className,
}: ProductImageProps) {
  const locale = useSiteLocale();
  const frame = cn('relative overflow-hidden bg-sand', className);

  if (!image) return <ImagePlaceholder name={name} className={frame} />;

  return (
    <div className={frame}>
      <Image
        src={image.src}
        alt={decorative ? '' : image.alt[locale]}
        fill
        sizes={sizes}
        loading={eager ? 'eager' : 'lazy'}
        className="object-cover"
      />
    </div>
  );
}
