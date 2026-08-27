import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import eslintConfigPrettier from 'eslint-config-prettier';
import tseslint from '@typescript-eslint/eslint-plugin';
import prettierPlugin from 'eslint-plugin-prettier';

const configDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(configDir, '../..');
const nextAppRoots = [
  path.join(repoRoot, 'apps', 'pwa'),
  path.join(repoRoot, 'apps', 'owner-dashboard'),
  path.join(repoRoot, 'apps', 'estate-manager-dashboard'),
];

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts']),

  eslintConfigPrettier,

  {
    settings: {
      next: {
        rootDir: nextAppRoots,
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      prettier: prettierPlugin,
    },

    rules: {
      'prettier/prettier': 'error',

      /**
       * A stay date is a calendar date, not a moment.
       *
       * The API stores check-in, a menu day and a requested experience date as
       * midnight UTC. Rendered in the reader's own timezone they land on the
       * previous evening for anyone west of Greenwich, and the whole stay
       * moves a day early — which is how the guest app came to show a booking
       * Lodgify called 18–20 September as 17–19, and the dashboard and the app
       * came to disagree about the same reservation.
       *
       * It was fixed twice, on one surface each time, because nobody swept for
       * the rest. This is the sweep made permanent: reach for one of these
       * fields with a local formatter and the build says no.
       *
       * Use lib/stay-date, which formats in UTC. Real instants — createdAt,
       * loggedAt, a cutoff — are none of these fields and are unaffected.
       */
      'no-restricted-syntax': [
        'error',
        {
          selector:
            "CallExpression[callee.name='format'] > CallExpression[callee.name='parseISO'] > MemberExpression[property.name=/^(checkIn|checkOut|preferredDate|confirmedDate|preferredFrom|preferredTo)$/]",
          message:
            "Stay dates are stored as midnight UTC — format() renders them in the reader's timezone and moves the day. Use lib/stay-date.",
        },
        {
          selector:
            "CallExpression[callee.name='format'] > NewExpression[callee.name='Date'] > MemberExpression[property.name=/^(checkIn|checkOut|preferredDate|confirmedDate|preferredFrom|preferredTo)$/]",
          message:
            "Stay dates are stored as midnight UTC — format() renders them in the reader's timezone and moves the day. Use lib/stay-date.",
        },
        {
          selector:
            "CallExpression[callee.property.name=/^toLocale(Date)?String$/][callee.object.callee.name='Date'][callee.object.arguments.0.property.name=/^(checkIn|checkOut|preferredDate|confirmedDate|preferredFrom|preferredTo)$/]",
          message:
            "Stay dates are stored as midnight UTC — toLocaleDateString renders them in the reader's timezone and moves the day. Use lib/stay-date.",
        },
      ],

      /* Unused vars */
      'no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  },
]);

export default eslintConfig;
