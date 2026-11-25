import type { ComponentProps, ReactNode } from 'react';

import { cn } from '@/lib/cn';

/** Centred page width with side padding (prototype .wrap). */
export function Container({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('mx-auto w-full max-w-site px-5', className)} {...props} />;
}

export type SectionTone = 'cream' | 'paper' | 'sand' | 'ink';

const tones: Record<SectionTone, string> = {
  cream: '',
  paper: 'bg-paper',
  sand: 'bg-sand',
  ink: 'bg-ink text-paper focus-ring-on-dark',
};

interface SectionProps extends ComponentProps<'section'> {
  tone?: SectionTone;
  /** "tight" uses the prototype's .sec-tight spacing. */
  spacing?: 'default' | 'tight';
}

/** A page band with the prototype's vertical spacing (.sec, .sec-tight, .band-*). */
export function Section({
  tone = 'cream',
  spacing = 'default',
  className,
  ...props
}: SectionProps) {
  return (
    <section
      className={cn(
        tones[tone],
        spacing === 'default' ? 'py-24 max-md:py-16' : 'py-16 max-md:py-11',
        className,
      )}
      {...props}
    />
  );
}

interface SectionHeadingProps {
  title: ReactNode;
  lede?: ReactNode;
  /** Heading level; the visual size stays the same. */
  level?: 1 | 2 | 3;
  id?: string;
  /** Shown at the end of the heading row, e.g. a "see all" link (prototype .head). */
  action?: ReactNode;
  className?: string;
}

/** Section title with an optional introduction and action (prototype .head, .d-l, .lede). */
export function SectionHeading({
  title,
  lede,
  level = 2,
  id,
  action,
  className,
}: SectionHeadingProps) {
  const Heading = `h${level}` as const;
  const text = (textClassName?: string) => (
    <div className={cn('flex min-w-0 flex-col gap-3', textClassName)}>
      <Heading id={id} className="m-0 text-display-l">
        {title}
      </Heading>
      {lede ? <p className="m-0 max-w-[34em] text-lede text-muted">{lede}</p> : null}
    </div>
  );
  if (!action) return text(className);
  return (
    <div className={cn('flex flex-wrap items-end justify-between gap-x-10 gap-y-4', className)}>
      {text()}
      <div className="shrink-0">{action}</div>
    </div>
  );
}
