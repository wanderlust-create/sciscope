import eslintPluginPrettier from "eslint-plugin-prettier";

export default [
  {
    ignores: ["node_modules/", "dist/", "coverage/"], // Ignore unnecessary folders
  },
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
    },
    plugins: {
      prettier: eslintPluginPrettier,
    },
    rules: {
      "prettier/prettier": "error",
      "no-unused-vars": "warn",
      "no-console": "off",
    },
  },
];

