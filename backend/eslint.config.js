import eslintPluginPrettier from 'eslint-plugin-prettier';

export default [
  {
    ignores: ['node_modules/', 'dist/', 'coverage/'],
  },
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    plugins: {
      prettier: eslintPluginPrettier,
    },
    rules: {
      'prettier/prettier': ['error', { semi: true }],
      'no-unused-vars': 'warn',
      'no-console': 'off',
    },
  },
];
