import eslintConfigInternxt from '@internxt/eslint-config-internxt';

export default [
  {
    ignores: ['dist'],
  },
  ...eslintConfigInternxt,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-restricted-imports': [
        'error',
        {
          patterns: ['src/*', '@/*'],
        },
      ],
    },
  },
];
