'use client';

import type { ChangeEvent, ComponentProps, KeyboardEvent, ReactNode } from 'react';
import { useEffect, useId, useRef } from 'react';

import { SearchIcon } from '@/components/icons';
import { chipClassName, Input, VisuallyHidden } from '@/components/ui';
import { cn } from '@/lib/cn';

// Building blocks for the shop and gallery filters. Presentational and controlled:
// the browser components own the state and the filtering rules live in lib/filters.

interface SearchFieldProps extends Omit<ComponentProps<'input'>, 'type' | 'onChange'> {
  /** Accessible label; hidden visually, as in the prototype. */
  label: string;
  value: string;
  onValueChange: (value: string) => void;
}

/** A rounded search box with a magnifier at the start (prototype .search). */
export function SearchField({
  label,
  value,
  onValueChange,
  className,
  id,
  ...props
}: SearchFieldProps) {
  const fallbackId = useId();
  const inputId = id ?? fallbackId;

  return (
    <div className={cn('relative w-full sm:w-[380px]', className)}>
      <label htmlFor={inputId}>
        <VisuallyHidden>{label}</VisuallyHidden>
      </label>
      <SearchIcon className="pointer-events-none absolute start-4 top-1/2 size-5 -translate-y-1/2 text-muted" />
      <Input
        id={inputId}
        type="search"
        value={value}
        onChange={(event: ChangeEvent<HTMLInputElement>) => onValueChange(event.target.value)}
        className="rounded-pill ps-12"
        {...props}
      />
    </div>
  );
}

export interface Choice<T extends string> {
  value: T;
  label: string;
}

interface ChoiceChipsProps<T extends string> {
  /** Names the group for screen readers. */
  label: string;
  /** Show the label before the chips (gallery) or keep it for screen readers only (shop). */
  showLabel?: boolean;
  options: readonly Choice<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

/**
 * A single-choice row of chips (prototype .filters, .frow), with radio-group semantics:
 * exactly one option is checked ("All" is an option), the group is one Tab stop, and the
 * arrow keys move and select, mirrored on right-to-left pages; Home and End jump to the
 * ends. Looks the same as the Chip primitive.
 */
export function ChoiceChips<T extends string>({
  label,
  showLabel = false,
  options,
  value,
  onChange,
  className,
}: ChoiceChipsProps<T>) {
  const labelId = useId();
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const checkedIndex = options.findIndex((option) => option.value === value);
  const tabStop = checkedIndex === -1 ? 0 : checkedIndex;

  const choose = (index: number) => {
    const next = (index + options.length) % options.length;
    const option = options[next];
    if (!option) return;
    onChange(option.value);
    buttons.current[next]?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const rtl = event.currentTarget.closest('[dir]')?.getAttribute('dir') === 'rtl';
    const forward = rtl ? 'ArrowLeft' : 'ArrowRight';
    const backward = rtl ? 'ArrowRight' : 'ArrowLeft';
    const moves: Record<string, number> = {
      [forward]: index + 1,
      ArrowDown: index + 1,
      [backward]: index - 1,
      ArrowUp: index - 1,
      Home: 0,
      End: options.length - 1,
    };
    const target = moves[event.key];
    if (target === undefined) return;
    event.preventDefault();
    choose(target);
  };

  return (
    <div
      role="radiogroup"
      aria-labelledby={labelId}
      className={cn('flex flex-wrap items-center gap-2', className)}
    >
      {showLabel ? (
        <span
          id={labelId}
          className="w-full text-sm font-medium text-muted sm:w-auto sm:min-w-[88px]"
        >
          {label}
        </span>
      ) : (
        <VisuallyHidden id={labelId}>{label}</VisuallyHidden>
      )}
      {options.map((option, index) => {
        const checked = index === checkedIndex;
        return (
          <button
            key={option.value}
            ref={(element) => {
              buttons.current[index] = element;
            }}
            type="button"
            role="radio"
            aria-checked={checked}
            tabIndex={index === tabStop ? 0 : -1}
            onClick={() => onChange(option.value)}
            onKeyDown={(event) => onKeyDown(event, index)}
            className={chipClassName(checked)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

interface ToggleFieldProps {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  className?: string;
}

/** A checkbox with its label, at least 44px tall (prototype .tog). */
export function ToggleField({ label, checked, onCheckedChange, className }: ToggleFieldProps) {
  return (
    <label
      className={cn(
        'inline-flex min-h-11 cursor-pointer items-center gap-2.5 text-[0.9375rem] font-medium',
        className,
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onCheckedChange(event.target.checked)}
        className="size-5 accent-ink"
      />
      {label}
    </label>
  );
}

/** Space kept between a sticky filter bar and the element that receives focus below it. */
const FOCUS_GAP_PX = 16;

interface FilterPanelProps {
  children: ReactNode;
  /**
   * Keep the panel at the top of the screen while the list scrolls (prototype gallery),
   * from 640px up. On phones the panel is too tall to stay on screen, so it scrolls away.
   */
  sticky?: boolean;
  className?: string;
}

/**
 * The bar that holds the filters, between rules (prototype .filters, .fbar).
 *
 * While it is sticky, the page reserves its height as scroll-padding-top, so a card or
 * control that receives keyboard focus is scrolled into view below the bar instead of
 * behind it (WCAG 2.4.11). The reservation follows the bar's height and is removed when
 * the bar is not sticky (below 640px) or unmounts.
 */
export function FilterPanel({ children, sticky = false, className }: FilterPanelProps) {
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = panel.current;
    if (!sticky || !element) return;
    const root = document.documentElement;

    const update = () => {
      const isSticky = getComputedStyle(element).position === 'sticky';
      root.style.scrollPaddingTop = isSticky
        ? `${Math.ceil(element.getBoundingClientRect().height) + FOCUS_GAP_PX}px`
        : '';
    };

    update();
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(update);
    // Border box: the reservation must follow padding and border changes too.
    observer?.observe(element, { box: 'border-box' });
    window.addEventListener('resize', update);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', update);
      root.style.scrollPaddingTop = '';
    };
  }, [sticky]);

  return (
    <div
      ref={panel}
      data-sticky-filters={sticky || undefined}
      className={cn(
        'flex flex-col gap-3.5 border-b border-line bg-cream pb-6',
        sticky && 'border-t pt-5 pb-5 sm:sticky sm:top-0 sm:z-10',
        className,
      )}
    >
      {children}
    </div>
  );
}

/** How many results the filters leave, announced politely when it changes. */
export function ResultCount({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p aria-live="polite" className={cn('m-0 text-small text-muted tabular-nums', className)}>
      {children}
    </p>
  );
}
