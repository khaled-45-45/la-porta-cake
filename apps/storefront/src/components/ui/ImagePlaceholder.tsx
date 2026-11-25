import { useTranslations } from 'next-intl';

import { cn } from '@/lib/cn';

interface ImagePlaceholderProps {
  /** Name of the product, for screen readers. */
  name: string;
  className?: string;
}

/**
 * Shown instead of a photo for products without an approved photo (decision 0006).
 * It never shows another product's photo.
 */
export function ImagePlaceholder({ name, className }: ImagePlaceholderProps) {
  const t = useTranslations('ImagePlaceholder');
  const label = t('noPhoto');

  return (
    <div
      role="img"
      aria-label={`${name}: ${label}`}
      data-placeholder="no-photo"
      className={cn(
        'relative flex flex-col items-center justify-center gap-3 overflow-hidden bg-sand text-muted',
        className,
      )}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        className="size-10 text-[#a8948a]"
      >
        <rect x="3" y="6" width="18" height="14" rx="2" />
        <circle cx="12" cy="13" r="3.5" />
        <path d="M8 6l1.5-2h5L16 6" />
      </svg>
      <span className="rounded-pill bg-paper px-3.5 py-1.5 text-small text-muted">{label}</span>
    </div>
  );
}
