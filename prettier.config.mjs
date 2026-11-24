import base from '@la-porta/config/prettier';

/** @type {import('prettier').Config} */
export default {
  ...base,
  tailwindStylesheet: './apps/storefront/src/app/globals.css',
};
