// Shared ESLint rules for every La Porta Cake package.
import js from '@eslint/js';
import tseslint from 'typescript-eslint';

/**
 * Physical direction classes break the Arabic (RTL) layout.
 * Use logical utilities instead: ms-/me-, ps-/pe-, start-/end-, text-start/text-end,
 * rounded-s/rounded-e, border-s/border-e.
 */
const PHYSICAL_DIRECTION_CLASS =
  '/(^|\\s)-?(ml|mr|pl|pr|left|right|text-left|text-right|rounded-l|rounded-r|rounded-tl|rounded-tr|rounded-bl|rounded-br|border-l|border-r|float-left|float-right)(-|\\s|$)/';

export const rtlSafeClassNames = {
  rules: {
    'no-restricted-syntax': [
      'error',
      {
        selector: `JSXAttribute[name.name='className'] Literal[value=${PHYSICAL_DIRECTION_CLASS}]`,
        message:
          'Use logical Tailwind classes (ms-, me-, ps-, pe-, start-, end-, text-start, text-end) so the layout works in Arabic and English.',
      },
    ],
  },
};

/** Base config for TypeScript packages without React. */
export default tseslint.config(
  { ignores: ['**/dist/**', '**/coverage/**', '**/.next/**', '**/node_modules/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
);
