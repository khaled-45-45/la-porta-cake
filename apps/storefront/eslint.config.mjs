import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

import { rtlSafeClassNames } from '@la-porta/config/eslint';

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  rtlSafeClassNames,
  {
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },
  globalIgnores(['.next/**', 'out/**', 'build/**', 'coverage/**', 'next-env.d.ts']),
]);
