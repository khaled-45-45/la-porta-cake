'use client';

import { useTranslations } from 'next-intl';
import type { ChangeEvent, ReactNode } from 'react';
import { useActionState, useEffect, useRef, useState } from 'react';

import type { CustomOrderField, CustomOrderValues, DecorationType } from '@la-porta/domain';

import { WhatsAppIcon } from '@/components/icons';
import { Button, Field, Input, Textarea, TextLink } from '@/components/ui';
import { useSiteLocale } from '@/i18n/use-site-locale';
import { cn } from '@/lib/cn';
import type { CustomOrderState } from '@/lib/custom-order-state';
import { INITIAL_CUSTOM_ORDER_STATE } from '@/lib/custom-order-state';
import { formatNumber } from '@/lib/format';
import { routes } from '@/lib/routes';

type LimitedField = 'name' | 'description' | 'flavour' | 'writing' | 'notes';

export interface CustomOrderFormProps {
  /** The server action that checks the inquiry and prepares the WhatsApp message. */
  action: (state: CustomOrderState, form: FormData) => Promise<CustomOrderState>;
  /** Slug of the chosen design, already checked as published on the server, or null. */
  designSlug: string | null;
  /** Starting values: the chosen design's decoration, "Mini" and only occasion. */
  defaults: Pick<CustomOrderValues, 'occasion' | 'decoration' | 'mini'>;
  /** Occasion options, names in the page's language. */
  occasions: readonly { id: string; name: string }[];
  decorations: readonly { value: DecorationType; label: string }[];
  limits: Readonly<Record<LimitedField, number>>;
  /** Accepted dates, YYYY-MM-DD. */
  earliestDate: string;
  latestDate: string;
  /** Whole days of notice, for the date hint. */
  leadDays: number;
  /**
   * The chosen design, rendered on the server (ChosenDesign). Shown beside the form
   * until the server says the design is no longer published.
   */
  chosenDesign?: ReactNode;
}

const EMPTY: CustomOrderValues = {
  occasion: '',
  decoration: '',
  mini: '',
  description: '',
  flavour: '',
  writing: '',
  date: '',
  name: '',
  notes: '',
};

const FIELD_ORDER: readonly CustomOrderField[] = [
  'occasion',
  'decoration',
  'description',
  'flavour',
  'writing',
  'date',
  'name',
  'notes',
];

const fieldId = (field: CustomOrderField) => `order-${field}`;
const characters = (text: string) => [...text].length;

/**
 * The custom-order inquiry form (prototype Custom). Only fields the shop's data supports
 * are asked for: no sizes or flavour list are offered, because none are confirmed.
 *
 * The form posts to a server action, which checks everything again and either returns
 * localized errors with the values, or a WhatsApp link and the prepared message. Nothing
 * is sent by the site: the customer reviews the message and sends it in WhatsApp, and
 * the shop confirms there. It works without JavaScript too (a normal form post).
 *
 * Accessibility: every control has a visible label; hints, counters and errors are tied
 * to it with aria-describedby; after a failed attempt an error summary with links to the
 * fields receives focus; when the message is ready, its panel receives focus.
 */
export function CustomOrderForm({
  action,
  designSlug,
  defaults,
  occasions,
  decorations,
  limits,
  earliestDate,
  latestDate,
  leadDays,
  chosenDesign,
}: CustomOrderFormProps) {
  const t = useTranslations('CustomOrder');
  const locale = useSiteLocale();
  const [state, formAction, pending] = useActionState(action, INITIAL_CUSTOM_ORDER_STATE);
  const [values, setValues] = useState<CustomOrderValues>(() =>
    state.status === 'idle' ? { ...EMPTY, ...defaults } : state.values,
  );
  // A prepared message describes the values it was made from; editing makes it stale.
  // Remembering which result was edited means a new result is fresh again by itself.
  const [editedResult, setEditedResult] = useState<CustomOrderState | null>(null);
  const edited = editedResult === state;
  const summaryRef = useRef<HTMLDivElement>(null);
  const readyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state.status === 'invalid') summaryRef.current?.focus();
    if (state.status === 'ready') readyRef.current?.focus();
  }, [state]);

  const errors = state.status === 'invalid' ? state.errors : {};
  // The server drops a design that is no longer published. The form remembers that for
  // the rest of the visit: the design is hidden and not posted again, the description is
  // required, and the notice stays. (Derived from the result while rendering, as React
  // recommends for state that follows a prop or result.)
  const [designDropped, setDesignDropped] = useState(false);
  if (!designDropped && state.status !== 'idle' && state.designUnavailable) {
    setDesignDropped(true);
  }
  const hasDesign = designSlug !== null && !designDropped;
  const errorFields = FIELD_ORDER.filter((field) => errors[field]);
  const showReady = state.status === 'ready' && !edited;

  const change =
    (field: keyof CustomOrderValues) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { value } = event.target;
      const next =
        event.target instanceof HTMLInputElement && event.target.type === 'checkbox'
          ? event.target.checked
            ? 'on'
            : ''
          : value;
      setValues((current) => ({ ...current, [field]: next }));
      setEditedResult(state);
    };

  const counter = (field: LimitedField) => (
    <p
      id={`${fieldId(field)}-count`}
      className={cn(
        'm-0 text-small text-muted tabular-nums',
        characters(values[field]) > limits[field] && 'font-semibold text-rose-ink',
      )}
    >
      {t('count', {
        count: formatNumber(characters(values[field]), locale),
        max: formatNumber(limits[field], locale),
      })}
    </p>
  );

  /** aria-describedby with the counter added to what Field links. */
  const withCounter = (describedBy: string | undefined, field: LimitedField) =>
    [describedBy, `${fieldId(field)}-count`].filter(Boolean).join(' ');

  const optionalLabel = (label: string) => (
    <>
      {label} <span className="font-normal text-muted">({t('optional')})</span>
    </>
  );

  const form = (
    <form
      action={formAction}
      noValidate
      aria-label={t('formLabel')}
      className="flex flex-col gap-7"
    >
      {hasDesign ? <input type="hidden" name="design" value={designSlug} /> : null}

      {designDropped ? (
        <p role="status" className="m-0 rounded-card border border-rose bg-paper px-4.5 py-3.5">
          {t('designUnavailable')}
        </p>
      ) : null}

      {errorFields.length > 0 ? (
        <div
          ref={summaryRef}
          tabIndex={-1}
          role="region"
          aria-labelledby="order-error-summary"
          className="flex flex-col gap-2 rounded-card border-[1.5px] border-rose-ink bg-paper px-5 py-4"
        >
          <p id="order-error-summary" className="m-0 font-semibold">
            {t('errorSummary')}
          </p>
          <ul className="m-0 flex list-disc flex-col gap-1 ps-5">
            {errorFields.map((field) => (
              <li key={field}>
                <a href={`#${fieldId(field)}`} className="text-rose-ink underline">
                  {t(`fields.${field}`)}: {errors[field]}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <Field
        id={fieldId('occasion')}
        label={optionalLabel(t('fields.occasion'))}
        error={errors.occasion}
      >
        {(control) => (
          <select
            {...control}
            name="occasion"
            value={values.occasion}
            onChange={change('occasion')}
            className="min-h-[52px] w-full rounded-field border-[1.5px] border-line bg-paper px-4 py-3 font-body text-base text-ink focus:border-ink aria-[invalid=true]:border-rose-ink"
          >
            <option value="">{t('noChoice')}</option>
            {occasions.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        )}
      </Field>

      <fieldset
        className="m-0 flex flex-col gap-2 border-0 p-0"
        aria-describedby={
          ['order-decoration-hint', errors.decoration ? 'order-decoration-error' : '']
            .filter(Boolean)
            .join(' ') || undefined
        }
      >
        <legend className="mb-2 p-0 text-[0.9375rem] font-semibold">
          {optionalLabel(t('fields.decoration'))}
        </legend>
        <div className="flex flex-wrap gap-2">
          {[{ value: '', label: t('noChoice') }, ...decorations].map((option, index) => (
            <RadioChip
              key={option.value || 'none'}
              id={index === 0 ? fieldId('decoration') : undefined}
              name="decoration"
              value={option.value}
              checked={values.decoration === option.value}
              onChange={change('decoration')}
              invalid={Boolean(errors.decoration)}
            >
              {option.label}
            </RadioChip>
          ))}
        </div>
        <p id="order-decoration-hint" className="m-0 text-small text-muted">
          <TextLink href={routes.ourWork}>{t('fields.decorationHint')}</TextLink>
        </p>
        {errors.decoration ? (
          <p id="order-decoration-error" className="m-0 text-small font-medium text-rose-ink">
            {errors.decoration}
          </p>
        ) : null}
      </fieldset>

      <label className="inline-flex min-h-11 cursor-pointer items-center gap-2.5 self-start text-[0.9375rem] font-semibold">
        <input
          type="checkbox"
          name="mini"
          checked={values.mini === 'on'}
          onChange={change('mini')}
          className="size-5 accent-ink"
        />
        {t('fields.mini')}
      </label>

      <div className="flex flex-col gap-2">
        <Field
          id={fieldId('description')}
          label={hasDesign ? optionalLabel(t('fields.description')) : t('fields.description')}
          hint={hasDesign ? t('fields.descriptionHintDesign') : t('fields.descriptionHint')}
          error={errors.description}
        >
          {(control) => (
            <Textarea
              {...control}
              aria-describedby={withCounter(control['aria-describedby'], 'description')}
              aria-required={hasDesign ? undefined : true}
              name="description"
              rows={4}
              value={values.description}
              onChange={change('description')}
            />
          )}
        </Field>
        {counter('description')}
      </div>

      <Field
        id={fieldId('flavour')}
        label={optionalLabel(t('fields.flavour'))}
        hint={t('fields.flavourHint')}
        error={errors.flavour}
      >
        {(control) => (
          <Input
            {...control}
            name="flavour"
            value={values.flavour}
            onChange={change('flavour')}
            autoComplete="off"
          />
        )}
      </Field>

      <div className="flex flex-col gap-2">
        <Field
          id={fieldId('writing')}
          label={optionalLabel(t('fields.writing'))}
          hint={t('fields.writingHint')}
          error={errors.writing}
        >
          {(control) => (
            <Input
              {...control}
              aria-describedby={withCounter(control['aria-describedby'], 'writing')}
              name="writing"
              value={values.writing}
              onChange={change('writing')}
              autoComplete="off"
              dir="auto"
            />
          )}
        </Field>
        {counter('writing')}
      </div>

      <Field
        id={fieldId('date')}
        label={optionalLabel(t('fields.date'))}
        hint={t('fields.dateHint', { days: leadDays, n: formatNumber(leadDays, locale) })}
        error={errors.date}
      >
        {(control) => (
          <Input
            {...control}
            type="date"
            name="date"
            min={earliestDate}
            max={latestDate}
            value={values.date}
            onChange={change('date')}
            className="sm:max-w-[280px]"
          />
        )}
      </Field>

      <Field id={fieldId('name')} label={optionalLabel(t('fields.name'))} error={errors.name}>
        {(control) => (
          <Input
            {...control}
            name="name"
            value={values.name}
            onChange={change('name')}
            autoComplete="name"
            className="sm:max-w-[420px]"
          />
        )}
      </Field>

      <div className="flex flex-col gap-2">
        <Field
          id={fieldId('notes')}
          label={optionalLabel(t('fields.notes'))}
          hint={t('fields.notesHint')}
          error={errors.notes}
        >
          {(control) => (
            <Textarea
              {...control}
              aria-describedby={withCounter(control['aria-describedby'], 'notes')}
              name="notes"
              rows={3}
              value={values.notes}
              onChange={change('notes')}
            />
          )}
        </Field>
        {counter('notes')}
      </div>

      <p className="m-0 rounded-card bg-sand px-4.5 py-3.5 text-small">{t('photoNote')}</p>

      {/* "No payment on the site" is said once, at the top of the page (CustomOrderView). */}
      <Button type="submit" variant="dark" block disabled={pending} className="min-h-14">
        {pending ? t('preparing') : t('submit')}
      </Button>

      {showReady ? (
        <div
          ref={readyRef}
          tabIndex={-1}
          role="region"
          aria-labelledby="order-ready-title"
          className="flex flex-col gap-4 rounded-panel border-[1.5px] border-ink bg-paper px-5 py-6 sm:px-6.5"
        >
          <h2 id="order-ready-title" className="m-0 text-display-s">
            {t('readyTitle')}
          </h2>
          <p className="m-0 text-muted">{t('readyBody')}</p>
          <figure className="m-0 flex flex-col gap-2">
            <figcaption className="text-small font-semibold">{t('previewLabel')}</figcaption>
            <p
              dir="auto"
              className="m-0 rounded-field bg-cream px-4 py-3.5 text-[0.9375rem] leading-[1.8] break-words whitespace-pre-line"
            >
              {state.message}
            </p>
          </figure>
          <Button href={state.whatsappUrl} block className="min-h-14 text-[1.0625rem]">
            <WhatsAppIcon />
            {t('openWhatsApp')}
          </Button>
          <p className="m-0 text-small text-muted">{t('readyEdit')}</p>
        </div>
      ) : null}
    </form>
  );

  if (!chosenDesign) return form;
  return (
    <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-14">
      {hasDesign ? chosenDesign : null}
      <div className="min-w-0">{form}</div>
    </div>
  );
}

interface RadioChipProps {
  id?: string;
  name: string;
  value: string;
  checked: boolean;
  invalid: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  children: ReactNode;
}

/** A native radio button drawn as a chip: arrow keys, one Tab stop and form posting come from the browser. */
function RadioChip({ id, name, value, checked, invalid, onChange, children }: RadioChipProps) {
  return (
    <label
      className={cn(
        'inline-flex min-h-11 cursor-pointer items-center rounded-pill border-[1.5px] px-4.5 text-[0.9375rem] font-medium transition-colors has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-rose-ink',
        checked
          ? 'border-ink bg-ink text-paper'
          : 'border-line bg-paper text-ink hover:border-rose',
        invalid && !checked && 'border-rose-ink',
      )}
    >
      <input
        id={id}
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
      {children}
    </label>
  );
}
