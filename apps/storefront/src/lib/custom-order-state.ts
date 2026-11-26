import type { CustomOrderField, CustomOrderValues } from '@la-porta/domain';

/**
 * What the custom-order action returns to the form. Shared by the server (which builds
 * it) and the form (which shows it), so it holds types and plain values only.
 *
 * Errors are already localized sentences for the customer; no validation internals
 * (schema paths, codes, limits as code) reach the browser.
 */
export type CustomOrderFieldErrors = Partial<Record<CustomOrderField, string>>;

export type CustomOrderState =
  | { status: 'idle' }
  | {
      status: 'invalid';
      errors: CustomOrderFieldErrors;
      /** The values as cleaned on the server, to fill the form again without JavaScript. */
      values: CustomOrderValues;
      /** The design the form referred to is no longer in the gallery. */
      designUnavailable: boolean;
    }
  | {
      status: 'ready';
      /** wa.me link to the shop's verified number, with the whole message encoded. */
      whatsappUrl: string;
      /** The prepared message, shown to the customer before they send it. */
      message: string;
      values: CustomOrderValues;
      designUnavailable: boolean;
    };

export const INITIAL_CUSTOM_ORDER_STATE: CustomOrderState = { status: 'idle' };

/** The form's field names, as posted. */
export const CUSTOM_ORDER_FORM_FIELDS = [
  'design',
  'occasion',
  'decoration',
  'mini',
  'description',
  'flavour',
  'writing',
  'date',
  'name',
  'notes',
] as const;
