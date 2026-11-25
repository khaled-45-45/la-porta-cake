import { useTranslations } from 'next-intl';

import { cn } from '@/lib/cn';

interface OccasionTagsProps {
  /** Occasion names in the page's language, in display order. */
  occasions: readonly string[];
  /** Adds the "Mini" tag. */
  isMini?: boolean;
  className?: string;
}

/** The occasions a design suits, as small sand tags (prototype .tags). */
export function OccasionTags({ occasions, isMini = false, className }: OccasionTagsProps) {
  const t = useTranslations('Gallery');
  const tags = isMini ? [...occasions, t('miniTag')] : occasions;
  if (tags.length === 0) return null;

  return (
    <ul className={cn('m-0 flex list-none flex-wrap gap-1.5 p-0', className)}>
      {tags.map((tag) => (
        <li
          key={tag}
          className="rounded-pill bg-sand px-2.5 py-[3px] text-[0.78125rem] leading-normal text-muted"
        >
          {tag}
        </li>
      ))}
    </ul>
  );
}
