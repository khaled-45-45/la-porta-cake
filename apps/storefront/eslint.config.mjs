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
  {
    // Pages and components read data only through the repositories (`@/lib/data`),
    // never from the JSON files or the local implementation directly. This keeps
    // the switch to an API data source in V2 a change in one place.
    files: ['src/app/**/*.{ts,tsx}', 'src/components/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/content/*', '**/content/*.json'],
              message: 'Read content through getRepositories() from "@/lib/data".',
            },
            {
              group: ['@/lib/data/*'],
              message: 'Import getRepositories from "@/lib/data", not its implementations.',
            },
          ],
        },
      ],
    },
  },
  {
    // Code that can run in the browser takes locale values from "@la-porta/domain/locale".
    // The package root also exports zod and every content schema, which would then be
    // shipped to every page. Type-only imports are erased and stay allowed.
    files: ['src/components/**/*.{ts,tsx}', 'src/i18n/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@la-porta/domain',
              allowTypeImports: true,
              message:
                'Import values from "@la-porta/domain/locale". The package root brings zod and all schemas into the browser bundle.',
            },
          ],
        },
      ],
    },
  },
  globalIgnores(['.next/**', 'out/**', 'build/**', 'coverage/**', 'next-env.d.ts']),
]);
