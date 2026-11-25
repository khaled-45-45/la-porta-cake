'use client';

import type { KeyboardEvent } from 'react';
import { useId, useRef, useState } from 'react';

import { CloseIcon, MenuIcon } from '@/components/icons';
import { Button } from '@/components/ui';
import { Link, usePathname } from '@/i18n/navigation';
import { cn } from '@/lib/cn';
import { routes, sectionForPath } from '@/lib/routes';

import type { NavItem } from './MainNav';

interface MobileMenuProps {
  items: readonly NavItem[];
  labels: {
    /** Accessible name of the menu button and of the navigation inside the panel. */
    menu: string;
    home: string;
    orderWhatsApp: string;
  };
  whatsappUrl: string;
}

/**
 * The menu button and its panel for small screens (prototype .nav-burger, .nav-drawer).
 *
 * A disclosure, not a dialog: the panel opens below the header bar and pushes the page
 * down, as in the prototype, so focus is not trapped. The button reports its state with
 * aria-expanded. Escape closes the panel and returns focus to the button, but only while
 * focus is on the button or inside the panel: Escape elsewhere (e.g. clearing the shop
 * search) is left alone. Following a link or changing page closes it. Rendered as two siblings (button, panel) so the header
 * can place the panel on its own row under the bar.
 */
export function MobileMenu({ items, labels, whatsappUrl }: MobileMenuProps) {
  const pathname = usePathname();
  // The menu belongs to the page it was opened on: any navigation closes it.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;
  const panelId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const current = sectionForPath(pathname);

  // Listens on the button and the panel only, so Escape in unrelated controls is untouched.
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Escape' || !open) return;
    event.preventDefault();
    setOpenOn(null);
    buttonRef.current?.focus();
  };

  const close = () => setOpenOn(null);
  const linkClass = 'border-b border-line py-3 text-lg no-underline';

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label={labels.menu}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpenOn(open ? null : pathname)}
        onKeyDown={onKeyDown}
        className="inline-flex size-[46px] shrink-0 items-center justify-center rounded-pill border-[1.5px] border-ink bg-transparent text-ink nav:hidden"
      >
        {open ? <CloseIcon className="size-[22px]" /> : <MenuIcon className="size-[22px]" />}
      </button>

      <div id={panelId} hidden={!open} onKeyDown={onKeyDown} className="basis-full nav:hidden">
        <nav aria-label={labels.menu} className="flex flex-col gap-0.5 pt-2 pb-6">
          <Link
            href={routes.home}
            onClick={close}
            aria-current={pathname === routes.home ? 'page' : undefined}
            className={linkClass}
          >
            {labels.home}
          </Link>
          {items.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              onClick={close}
              aria-current={item.key === current ? 'page' : undefined}
              className={cn(linkClass, item.key === current && 'text-rose-ink')}
            >
              {item.label}
            </Link>
          ))}
          <Button href={whatsappUrl} variant="dark" block className="mt-4">
            {labels.orderWhatsApp}
          </Button>
        </nav>
      </div>
    </>
  );
}
