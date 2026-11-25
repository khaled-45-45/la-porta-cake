import type { ComponentProps, ReactNode } from 'react';

import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/cn';

export type ButtonVariant = 'dark' | 'line' | 'rose' | 'light';
export type ButtonSize = 'md' | 'sm';

// Prototype .btn, .btn-dark, .btn-line, .btn-rose, .btn-light, .btn-sm, .btn-block
const base =
  'inline-flex min-h-[50px] items-center justify-center gap-2.5 whitespace-nowrap rounded-pill border-[1.5px] px-6.5 text-base font-semibold leading-none no-underline transition-colors disabled:cursor-not-allowed disabled:opacity-60 [&_svg]:size-5 [&_svg]:shrink-0';

const variants: Record<ButtonVariant, string> = {
  dark: 'border-ink bg-ink text-paper hover:border-ink-hover hover:bg-ink-hover',
  line: 'border-ink bg-transparent text-ink hover:bg-paper',
  rose: 'border-rose bg-rose text-ink hover:border-rose-dark hover:bg-rose-dark',
  light: 'border-paper bg-paper text-ink hover:bg-cream',
};

const sizes: Record<ButtonSize, string> = {
  md: '',
  sm: 'min-h-11 px-4.5 text-[0.9375rem]',
};

interface CommonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Full width. */
  block?: boolean;
  className?: string;
  children: ReactNode;
}

type ButtonAsButton = CommonProps &
  Omit<ComponentProps<'button'>, keyof CommonProps> & {
    href?: undefined;
  };

type ButtonAsLink = CommonProps &
  Omit<ComponentProps<'a'>, keyof CommonProps | 'href'> & {
    /** A path inside the site ("/shop") or a full URL ("https://wa.me/…"). */
    href: string;
  };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

export function buttonClassName({
  variant = 'dark',
  size = 'md',
  block = false,
  className,
}: Omit<CommonProps, 'children'>): string {
  return cn(base, variants[variant], sizes[size], block && 'w-full', className);
}

const isExternal = (href: string) => /^(https?:|mailto:|tel:)/.test(href);

/**
 * The site's button. Renders a <button>, or a link when `href` is given:
 * internal paths keep the current language; full URLs open as they are.
 */
export function Button(props: ButtonProps) {
  const { variant, size, block, className, children, ...rest } = props;
  const classes = buttonClassName({ variant, size, block, className });

  if (rest.href !== undefined) {
    const { href, ...anchorProps } = rest;
    if (isExternal(href)) {
      return (
        <a href={href} className={classes} {...anchorProps}>
          {children}
        </a>
      );
    }
    return (
      <Link href={href} className={classes} {...anchorProps}>
        {children}
      </Link>
    );
  }

  const { type = 'button', ...buttonProps } = rest;
  return (
    <button type={type} className={classes} {...buttonProps}>
      {children}
    </button>
  );
}
