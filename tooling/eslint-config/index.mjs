import js from '@eslint/js';
import tseslint from 'typescript-eslint';

/**
 * A shared ESLint configuration for @tuquet monorepo.
 */
export const config = [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }
      ]
    }
  },
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**', '*.d.ts']
  }
];

export default config;
