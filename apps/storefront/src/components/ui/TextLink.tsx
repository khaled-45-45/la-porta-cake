import type { ComponentProps, ReactNode } from 'react';

import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/cn';

// Prototype .tlink: semibold, rose underline that darkens on hover.
const textLink =
  'font-semibold underline decoration-rose decoration-[1.5px] underline-offset-[6px] transition-colors hover:decoration-ink';

export function textLinkClassName(className?: string): string {
  return cn(textLink, className);
}

interface TextLinkProps extends Omit<ComponentProps<'a'>, 'href'> {
  /** A path inside the site ("/shop") or a full URL. */
  href: string;
  children: ReactNode;
}

const isExternal = (href: string) => /^(https?:|mailto:|tel:)/.test(href);

/** An inline text link. Internal paths keep the current language; full URLs open as they are. */
export function TextLink({ href, className, children, ...props }: TextLinkProps) {
  const classes = textLinkClassName(className);
  if (isExternal(href)) {
    return (
      <a href={href} className={classes} {...props}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={classes} {...props}>
      {children}
    </Link>
  );
}
