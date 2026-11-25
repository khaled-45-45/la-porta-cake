import type { ComponentProps, ReactNode } from 'react';

import { cn } from '@/lib/cn';

// Prototype .field, .inp
const control =
  'w-full rounded-field border-[1.5px] border-line bg-paper px-4 py-3 font-body text-base text-ink placeholder:text-muted focus:border-ink focus:outline-none aria-[invalid=true]:border-rose-ink';

export function Label({ className, ...props }: ComponentProps<'label'>) {
  return <label className={cn('text-[0.9375rem] font-semibold', className)} {...props} />;
}

export function Input({ className, ...props }: ComponentProps<'input'>) {
  return <input className={cn(control, 'min-h-[52px]', className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<'textarea'>) {
  return (
    <textarea
      className={cn(control, 'min-h-[120px] resize-y leading-[1.7]', className)}
      {...props}
    />
  );
}

/** Attributes Field passes to its control so the label, hint and error are linked. */
export interface FieldControlProps {
  id: string;
  'aria-describedby': string | undefined;
  'aria-invalid': true | undefined;
}

interface FieldProps {
  id: string;
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  className?: string;
  children: (control: FieldControlProps) => ReactNode;
}

/**
 * A labelled form control with optional hint and error text.
 * The label is tied to the control, and the hint and error are announced with it.
 */
export function Field({ id, label, hint, error, className, children }: FieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <Label htmlFor={id}>{label}</Label>
      {children({ id, 'aria-describedby': describedBy, 'aria-invalid': error ? true : undefined })}
      {hint ? (
        <p id={hintId} className="m-0 text-small text-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="m-0 text-small font-medium text-rose-ink">
          {error}
        </p>
      ) : null}
    </div>
  );
}
