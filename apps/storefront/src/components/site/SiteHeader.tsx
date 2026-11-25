import { useTranslations } from 'next-intl';

import { WhatsAppIcon } from '@/components/icons';
import { Button, Container, LanguageSwitcher } from '@/components/ui';
import { MAIN_NAV } from '@/lib/routes';

import { BrandLink } from './BrandLink';
import type { NavItem } from './MainNav';
import { MainNav } from './MainNav';
import { MobileMenu } from './MobileMenu';

interface SiteHeaderProps {
  /** WhatsApp link from the store settings (wa.me). */
  whatsappUrl: string;
}

/**
 * The site header (prototype Nav): logo, main navigation, language switch and WhatsApp
 * order button. Below 1100px the links and the WhatsApp button move into the menu panel.
 * Not sticky: the prototype header scrolls with the page.
 */
export function SiteHeader({ whatsappUrl }: SiteHeaderProps) {
  const t = useTranslations('Nav');
  const items: NavItem[] = MAIN_NAV.map((item) => ({ ...item, label: t(item.key) }));

  return (
    <header className="border-b border-line bg-cream">
      <Container className="flex flex-wrap items-center gap-x-3.5">
        <div className="flex min-h-[84px] grow items-center justify-between gap-6">
          <BrandLink />
          <MainNav items={items} label={t('label')} />
          <div className="flex items-center gap-3.5">
            <LanguageSwitcher />
            <Button href={whatsappUrl} size="sm" className="max-nav:hidden">
              <WhatsAppIcon />
              {t('orderWhatsApp')}
            </Button>
          </div>
        </div>
        <MobileMenu
          items={items}
          whatsappUrl={whatsappUrl}
          labels={{ menu: t('menu'), home: t('home'), orderWhatsApp: t('orderWhatsApp') }}
        />
      </Container>
    </header>
  );
}
