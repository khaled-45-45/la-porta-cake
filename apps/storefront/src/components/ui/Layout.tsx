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
  ink: 'bg-ink text-paper',
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
  className?: string;
}

/** Section title with an optional introduction (prototype .head, .d-l, .lede). */
export function SectionHeading({ title, lede, level = 2, id, className }: SectionHeadingProps) {
  const Heading = `h${level}` as const;
  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <Heading id={id} className="m-0 text-display-l">
        {title}
      </Heading>
      {lede ? <p className="m-0 max-w-[34em] text-lede text-muted">{lede}</p> : null}
    </div>
  );
}
