import { useTranslations } from 'next-intl';

import { DoorwayMark } from '@/components/icons';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/cn';
import { routes } from '@/lib/routes';

/**
 * The La Porta logo: doorway mark, "La Porta" in Marcellus and a short line under it
 * (prototype .brand). Links to the home page in the current language.
 */
export function BrandLink({ className }: { className?: string }) {
  const t = useTranslations('Nav');

  return (
    <Link href={routes.home} className={cn('flex items-center gap-3 no-underline', className)}>
      <DoorwayMark className="h-[38px] w-[30px] shrink-0 text-rose-dark" />
      <span className="flex flex-col leading-[1.1]">
        {/* The brand name is Latin on both pages. */}
        <span lang="en" className="font-latin text-[1.6875rem] tracking-[0.03em]">
          La Porta
        </span>
        <span className="mt-1 text-[0.78125rem] text-muted">{t('brandSub')}</span>
      </span>
    </Link>
  );
}
