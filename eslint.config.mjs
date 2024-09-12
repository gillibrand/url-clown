import globals from 'globals';
import pluginJs from '@eslint/js';

export default [
  pluginJs.configs.recommended,
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.webextensions },
    },
    rules: [
      {
        'no-unused-vars': [
          'error',
          {
            vars: 'all',
            args: 'after-used',
            caughtErrors: 'none',
            ignoreRestSiblings: false,
            reportUsedIgnorePattern: false,
          },
        ],
      },
    ],
  },
];
