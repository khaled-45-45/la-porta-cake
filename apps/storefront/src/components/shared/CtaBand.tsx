import { buttonClassName } from '@/components/ui';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/cn';

interface CtaBandProps {
  title: string;
  body: string;
  /** Text of the rose button on the band. */
  actionLabel: string;
  /** Path inside the site. The whole band is one link. */
  href: string;
  className?: string;
}

/**
 * A dark band that invites the next step, e.g. from the shop to "our work"
 * (prototype shop banner). The whole band is a single link; the button is its visual cue.
 */
export function CtaBand({ title, body, actionLabel, href, className }: CtaBandProps) {
  return (
    <Link
      href={href}
      className={cn(
        'grid grid-cols-1 items-center gap-6 rounded-panel bg-ink px-6 py-7 text-paper no-underline sm:grid-cols-[minmax(0,1fr)_auto] sm:px-8',
        className,
      )}
    >
      <span className="flex flex-col gap-1.5">
        <span className="text-display-s text-paper">{title}</span>
        <span className="text-on-ink-muted">{body}</span>
      </span>
      <span
        className={buttonClassName({
          variant: 'rose',
          size: 'sm',
          className: 'justify-self-start',
        })}
      >
        {actionLabel}
      </span>
    </Link>
  );
}
